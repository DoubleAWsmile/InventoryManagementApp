import { configureApiClient, configureHostedApiClient } from "./apiClient";
import { isDesktopApp } from "../config/runtime";

export type DesktopBackendConfig = {
  baseUrl: string;
  token: string;
};

export type StartupState =
  | { status: "loading" }
  | { status: "ready"; mode: "hosted" | "desktop" }
  | { status: "error"; message: string };

export function startupError(error: unknown): StartupState {
  const message = error instanceof Error ? error.message : String(error);
  return {
    status: "error",
    message: message || "The local desktop service could not be started.",
  };
}

export async function initializeApiRuntime(): Promise<StartupState> {
  if (!isDesktopApp) {
    configureHostedApiClient();
    return { status: "ready", mode: "hosted" };
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const config = await invoke<DesktopBackendConfig>("get_desktop_backend_config");
    configureApiClient(config);
    return { status: "ready", mode: "desktop" };
  } catch (error) {
    return startupError(error);
  }
}
