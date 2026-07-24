import { Map, Compass, ChevronRight } from "lucide-react";
import { TopNav, NavStrip } from "../components/TopNav";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";

export interface InventoryMapPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function InventoryMapPage({ onSignOut, onNavigate, onSettings }: InventoryMapPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID["map"] ?? "map"}
          onSelect={(id) => {
            const p = NAV_ID_TO_PAGE[id];
            if (p) onNavigate(p);
          }}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">
            Dashboard
          </button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Inventory Map</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1
              className="font-display text-[26px] text-foreground leading-tight"
              style={{ letterSpacing: "-0.03em" }}
            >
              Inventory Map
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              A visual map of where your items are located is coming soon.
            </p>
          </div>
        </div>

        {/* Coming soon card */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 rounded-3xl bg-accent/10 flex items-center justify-center mb-6">
            <Map size={40} className="text-accent" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-5">
            <Compass size={11} className="text-accent" />
            <span className="text-xs font-semibold text-accent">Coming Soon</span>
          </div>
          <h2 className="font-display text-2xl text-foreground mb-3">Visual Room Mapping</h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            We're building an interactive map of your home where you can drag and drop items into rooms, see
            inventory density at a glance, and quickly find where everything lives.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg">
            {[
              { label: "Room-by-room view", desc: "Click any room to see all items inside" },
              { label: "Drag & drop", desc: "Move items between rooms visually" },
              { label: "Heatmap mode", desc: "See which rooms have the most items" },
            ].map((f) => (
              <div key={f.label} className="bg-card rounded-2xl border border-border p-4 text-left shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                  <Map size={14} className="text-accent" />
                </div>
                <p className="text-xs font-bold text-foreground">{f.label}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate("allItems")}
            className="mt-8 flex items-center gap-2 h-9 px-4 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Browse Inventory Instead
          </button>
        </div>
      </main>
    </div>
  );
}
