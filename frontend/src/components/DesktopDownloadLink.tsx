import { Download } from "lucide-react";
import { DOWNLOAD_PATH } from "../app/webRoutes";
import { appRuntime, type AppRuntime } from "../config/runtime";

type DesktopDownloadLinkProps = {
  runtime?: AppRuntime;
  compact?: boolean;
};

export default function DesktopDownloadLink({
  runtime = appRuntime,
  compact = false,
}: DesktopDownloadLinkProps) {
  if (!runtime.isWebApp) return null;

  return (
    <a
      href={DOWNLOAD_PATH}
      className={
        compact
          ? "inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          : "h-9 px-3 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      }
    >
      <Download size={compact ? 14 : 15} />
      Desktop app
    </a>
  );
}
