export type DownloadPlatform = "windows" | "macos" | "linux";

export type DesktopDownload = {
  platform: DownloadPlatform;
  label: string;
  url: string;
  format: string;
  architecture: string;
  releaseStatus: "available";
};

export type DownloadEnvironment = {
  VITE_DOWNLOAD_WINDOWS_URL?: string;
  VITE_DOWNLOAD_MACOS_URL?: string;
  VITE_DOWNLOAD_LINUX_URL?: string;
};

export function configuredDownloads(environment: DownloadEnvironment): DesktopDownload[] {
  const candidates: Array<[DownloadPlatform, string, string, string, string | undefined]> = [
    ["windows", "Windows", "NSIS installer", "x86_64", environment.VITE_DOWNLOAD_WINDOWS_URL],
    ["macos", "macOS", "Installer", "Universal", environment.VITE_DOWNLOAD_MACOS_URL],
    ["linux", "Linux", "Package", "x86_64", environment.VITE_DOWNLOAD_LINUX_URL],
  ];

  return candidates.flatMap(([platform, label, format, architecture, rawUrl]) => {
    const url = rawUrl?.trim();
    return url ? [{ platform, label, url, format, architecture, releaseStatus: "available" as const }] : [];
  });
}

export const desktopDownloads = configuredDownloads(import.meta.env);
