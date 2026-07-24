/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET?: "web" | "desktop";
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DOWNLOAD_WINDOWS_URL?: string;
  readonly VITE_DOWNLOAD_MACOS_URL?: string;
  readonly VITE_DOWNLOAD_LINUX_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
