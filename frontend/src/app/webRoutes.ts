import type { AppRuntime } from "../config/runtime";

export const DOWNLOAD_PATH = "/download";

export type DownloadRouteAction = "render" | "redirect" | "ignore";

export function downloadRouteAction(pathname: string, runtime: AppRuntime): DownloadRouteAction {
  const isDownloadPath = pathname.replace(/\/+$/, "") === DOWNLOAD_PATH;
  if (!isDownloadPath) return "ignore";
  return runtime.isWebApp ? "render" : "redirect";
}

export function isDownloadRoute(pathname: string, runtime: AppRuntime): boolean {
  return downloadRouteAction(pathname, runtime) === "render";
}
