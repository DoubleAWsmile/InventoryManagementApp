use serde::{Deserialize, Serialize};
use std::{
    io::{Read, Write},
    net::{IpAddr, SocketAddr, TcpStream},
    sync::Mutex,
    time::Duration,
};
use tauri::{Emitter, Manager};
use tauri_plugin_shell::{process::CommandChild, process::CommandEvent, ShellExt};

const STARTUP_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopBackendConfig {
    base_url: String,
    token: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReadinessMessage {
    status: String,
    host: String,
    port: u16,
    token: String,
    #[serde(default)]
    database_path: String,
}

#[derive(Debug)]
enum BackendStatus {
    Starting,
    Ready(DesktopBackendConfig),
    Failed(String),
    ShuttingDown,
}

struct BackendState {
    status: Mutex<BackendStatus>,
    child: Mutex<Option<CommandChild>>,
}

impl Default for BackendState {
    fn default() -> Self {
        Self {
            status: Mutex::new(BackendStatus::Starting),
            child: Mutex::new(None),
        }
    }
}

fn parse_readiness(line: &str) -> Result<DesktopBackendConfig, String> {
    let message: ReadinessMessage = serde_json::from_str(line)
        .map_err(|_| "Local service returned malformed startup data".to_string())?;
    if message.status != "ready" {
        return Err("Local service did not report ready status".into());
    }
    let address: IpAddr = message
        .host
        .parse()
        .map_err(|_| "Local service reported an invalid host".to_string())?;
    if !address.is_loopback() {
        return Err("Local service did not bind to a loopback address".into());
    }
    if message.port == 0 {
        return Err("Local service reported an invalid port".into());
    }
    if message.token.trim().is_empty() {
        return Err("Local service did not provide an authorization token".into());
    }

    let host = match address {
        IpAddr::V4(_) => address.to_string(),
        IpAddr::V6(_) => format!("[{address}]"),
    };
    let _ = message.database_path;
    Ok(DesktopBackendConfig {
        base_url: format!("http://{host}:{}", message.port),
        token: message.token,
    })
}

fn set_failure(app: &tauri::AppHandle, message: impl Into<String>) {
    let message = message.into();
    let state = app.state::<BackendState>();
    let mut status = state.status.lock().expect("backend status lock poisoned");
    if !matches!(*status, BackendStatus::ShuttingDown) {
        *status = BackendStatus::Failed(message.clone());
        let _ = app.emit("desktop-backend-error", message);
    }
}

async fn start_sidecar(app: tauri::AppHandle) {
    let command = match app.shell().sidecar("desktop-api") {
        Ok(command) => command,
        Err(_) => {
            set_failure(&app, "The local service binary is missing or unavailable");
            return;
        }
    };
    let (mut events, child) = match command.spawn() {
        Ok(process) => process,
        Err(_) => {
            set_failure(&app, "The local service could not be launched");
            return;
        }
    };
    *app.state::<BackendState>()
        .child
        .lock()
        .expect("backend child lock poisoned") = Some(child);

    let mut stdout = Vec::new();
    let readiness = tokio::time::timeout(STARTUP_TIMEOUT, async {
        loop {
            match events.recv().await {
                Some(CommandEvent::Stdout(bytes)) => {
                    stdout.extend(bytes);
                    if let Some(end) = stdout.iter().position(|byte| *byte == b'\n') {
                        let line = String::from_utf8(stdout[..end].to_vec()).map_err(|_| {
                            "Local service returned invalid startup data".to_string()
                        })?;
                        return parse_readiness(line.trim());
                    }
                }
                Some(CommandEvent::Stderr(bytes)) => {
                    eprintln!(
                        "desktop-api: {}",
                        String::from_utf8_lossy(&bytes).trim_end()
                    );
                }
                Some(CommandEvent::Terminated(_)) | None => {
                    return Err("Local service exited before it was ready".into());
                }
                Some(CommandEvent::Error(_)) => {
                    return Err("Local service failed while starting".into());
                }
                _ => {}
            }
        }
    })
    .await;

    let config = match readiness {
        Ok(Ok(config)) => config,
        Ok(Err(message)) => {
            set_failure(&app, message);
            kill_sidecar(&app);
            return;
        }
        Err(_) => {
            set_failure(&app, "Timed out while starting the local service");
            kill_sidecar(&app);
            return;
        }
    };
    *app.state::<BackendState>()
        .status
        .lock()
        .expect("backend status lock poisoned") = BackendStatus::Ready(config);

    while let Some(event) = events.recv().await {
        match event {
            CommandEvent::Stderr(bytes) => {
                eprintln!(
                    "desktop-api: {}",
                    String::from_utf8_lossy(&bytes).trim_end()
                );
            }
            CommandEvent::Terminated(_) | CommandEvent::Error(_) => {
                set_failure(
                    &app,
                    "The local service stopped unexpectedly. Restart the desktop application.",
                );
                break;
            }
            _ => {}
        }
    }
}

fn kill_sidecar(app: &tauri::AppHandle) {
    if let Some(child) = app
        .state::<BackendState>()
        .child
        .lock()
        .expect("backend child lock poisoned")
        .take()
    {
        let _ = child.kill();
    }
}

fn request_graceful_shutdown(config: &DesktopBackendConfig) -> std::io::Result<()> {
    let url = config
        .base_url
        .strip_prefix("http://")
        .unwrap_or(&config.base_url);
    let socket: SocketAddr = url.parse().map_err(std::io::Error::other)?;
    let mut stream = TcpStream::connect_timeout(&socket, Duration::from_millis(500))?;
    stream.set_read_timeout(Some(Duration::from_millis(500)))?;
    write!(
        stream,
        "POST /api/desktop/shutdown HTTP/1.1\r\nHost: {url}\r\nAuthorization: Bearer {}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
        config.token
    )?;
    stream.flush()?;
    let mut response = [0_u8; 64];
    let _ = stream.read(&mut response);
    Ok(())
}

fn stop_sidecar(app: &tauri::AppHandle) {
    let config = {
        let state = app.state::<BackendState>();
        let mut status = state.status.lock().expect("backend status lock poisoned");
        let config = match &*status {
            BackendStatus::Ready(config) => Some(config.clone()),
            _ => None,
        };
        *status = BackendStatus::ShuttingDown;
        config
    };
    if let Some(config) = config {
        let _ = request_graceful_shutdown(&config);
        std::thread::sleep(Duration::from_millis(500));
    }
    kill_sidecar(app);
}

#[tauri::command]
async fn get_desktop_backend_config(
    state: tauri::State<'_, BackendState>,
) -> Result<DesktopBackendConfig, String> {
    for _ in 0..120 {
        {
            let status = state
                .status
                .lock()
                .map_err(|_| "Local service state is unavailable")?;
            match &*status {
                BackendStatus::Ready(config) => return Ok(config.clone()),
                BackendStatus::Failed(message) => return Err(message.clone()),
                BackendStatus::ShuttingDown => {
                    return Err("The local service is shutting down".into())
                }
                BackendStatus::Starting => {}
            }
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    Err("Timed out waiting for the local service".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BackendState::default())
        .setup(|app| {
            tauri::async_runtime::spawn(start_sidecar(app.handle().clone()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_desktop_backend_config])
        .build(tauri::generate_context!())
        .expect("error while building desktop application");

    app.run(|app, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            stop_sidecar(app);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_valid_readiness_without_exposing_database_path() {
        let config = parse_readiness(
            r#"{"status":"ready","host":"127.0.0.1","port":59355,"token":"secret","databasePath":"private.db"}"#,
        )
        .unwrap();
        assert_eq!(config.base_url, "http://127.0.0.1:59355");
        assert_eq!(config.token, "secret");
    }

    #[test]
    fn rejects_malformed_or_unsafe_readiness() {
        assert!(parse_readiness("not-json").is_err());
        assert!(
            parse_readiness(r#"{"status":"ready","host":"0.0.0.0","port":1,"token":"x"}"#).is_err()
        );
        assert!(
            parse_readiness(r#"{"status":"ready","host":"127.0.0.1","port":0,"token":"x"}"#)
                .is_err()
        );
        assert!(
            parse_readiness(r#"{"status":"waiting","host":"127.0.0.1","port":1,"token":"x"}"#)
                .is_err()
        );
    }
}
