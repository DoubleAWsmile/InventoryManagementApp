import { useEffect, useState } from "react";
import { initializeApiRuntime, type StartupState } from "../services/desktopRuntime";
import { LOCAL_API_FAILURE_EVENT } from "../services/apiClient";

export default function RuntimeBootstrap({ children }: { children: React.ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<StartupState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    void initializeApiRuntime().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (state.status !== "ready" || state.mode !== "desktop") return;

    let active = true;
    const listener = import("@tauri-apps/api/event").then(({ listen }) =>
      listen<string>("desktop-backend-error", (event) => {
        if (active) setState({ status: "error", message: event.payload });
      }),
    );
    return () => {
      active = false;
      void listener.then((unlisten) => unlisten());
    };
  }, [state.status === "ready" ? state.mode : undefined]);

  useEffect(() => {
    const handleFailure = () => {
      setState({
        status: "error",
        message: "The local inventory service is unavailable. Restart the desktop application.",
      });
    };
    window.addEventListener(LOCAL_API_FAILURE_EVENT, handleFailure);
    return () => window.removeEventListener(LOCAL_API_FAILURE_EVENT, handleFailure);
  }, []);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Starting your local inventory…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <section className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Local inventory could not start</h1>
          <p className="mt-3 text-sm text-muted-foreground">{state.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            If another desktop instance is open, close it first. You can then retry or restart the app.
          </p>
          <button
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => setAttempt((value) => value + 1)}
            type="button"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return children;
}
