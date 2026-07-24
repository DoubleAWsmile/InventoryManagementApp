import { Apple, Download, Layers, Monitor, Terminal } from "lucide-react";
import { desktopDownloads, type DownloadPlatform } from "../config/downloads";

const platformIcons: Record<DownloadPlatform, typeof Monitor> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal,
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#131318]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Layers size={17} />
            </span>
            <span className="text-lg font-bold">
              Home<span className="text-[#7B9FFF]">Vault</span>
            </span>
          </a>
          <a href="/" className="text-sm font-medium text-white/65 hover:text-white">
            Back to HomeVault
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Download size={29} />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">HomeVault Desktop</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your inventory, fully local.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Use HomeVault on your computer with a private local database. Your desktop inventory remains on
            your device and works independently of the hosted service.
          </p>
        </section>

        <section className="mx-auto mt-14 max-w-3xl">
          {desktopDownloads.length ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {desktopDownloads.map((download) => {
                const Icon = platformIcons[download.platform];
                return (
                  <a
                    key={download.platform}
                    href={download.url}
                    className="group rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                  >
                    <Icon size={30} className="mx-auto text-muted-foreground group-hover:text-accent" />
                    <div className="mt-4 text-sm font-semibold">Download for {download.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {download.format} · {download.architecture}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-9 text-center shadow-sm">
              <h2 className="text-xl font-semibold">Desktop downloads are coming soon</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Installers are not published yet. Check back here when the first desktop release is ready.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
