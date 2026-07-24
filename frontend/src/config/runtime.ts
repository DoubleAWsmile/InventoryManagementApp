export type AppTarget = "web" | "desktop";

export type AppRuntime = {
  appTarget: AppTarget;
  isTauriRuntime: boolean;
  isDesktopApp: boolean;
  isWebApp: boolean;
};

export function detectTauriRuntime(
  scope: unknown = typeof window === "undefined" ? undefined : window,
): boolean {
  return typeof scope === "object" && scope !== null && "__TAURI_INTERNALS__" in scope;
}

export function resolveAppRuntime(rawTarget: string | undefined, tauriDetected: boolean): AppRuntime {
  const normalized = rawTarget?.trim().toLowerCase();
  if (normalized && normalized !== "web" && normalized !== "desktop") {
    throw new Error(`Unsupported VITE_APP_TARGET: ${rawTarget}`);
  }

  const appTarget: AppTarget = normalized === "desktop" ? "desktop" : "web";
  return {
    appTarget,
    isTauriRuntime: tauriDetected,
    isDesktopApp: appTarget === "desktop" || tauriDetected,
    isWebApp: appTarget === "web" && !tauriDetected,
  };
}

export const appRuntime = resolveAppRuntime(import.meta.env.VITE_APP_TARGET, detectTauriRuntime());
export const appTarget = appRuntime.appTarget;
export const isDesktopApp = appRuntime.isDesktopApp;
export const isWebApp = appRuntime.isWebApp;
