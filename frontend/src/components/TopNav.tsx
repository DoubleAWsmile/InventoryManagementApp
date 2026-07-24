import { Settings, Layers, Package, Map, Home, Tag, Plus, Heart, BarChart2 } from "lucide-react";
import SearchBar from "./SearchBar";
import NotificationsButton from "./NotificationsButton";
import type { NavItem } from "../types";
import DesktopDownloadLink from "./DesktopDownloadLink";

/* ── Logo ────────────────────────────────────────────────────────── */

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <Layers size={16} className="text-white" />
      </div>
      <span className="text-[17px] font-bold" style={{ letterSpacing: "-0.02em" }}>
        <span className="text-white">Home</span>
        <span style={{ color: "#7B9FFF" }}>Vault</span>
      </span>
    </div>
  );
}

/* ── TopNav ──────────────────────────────────────────────────────── */

export interface TopNavProps {
  onSignOut: () => void;
  onSettings?: () => void;
  onNavigate?: (page: import("../types").PageName, query?: string) => void;
  /** @deprecated */
  searchVal?: string;
  /** @deprecated */
  setSearchVal?: (v: string) => void;
}

export function TopNav({ onSignOut, onSettings, onNavigate }: TopNavProps) {
  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: "#131318", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 h-14 flex items-center gap-3 lg:gap-6">
        {/* Logo */}
        <div className="min-w-0 sm:min-w-[180px]">
          <Logo />
        </div>

        {/* Search */}
        <div className="hidden md:block flex-1 max-w-2xl mx-auto">
          <SearchBar onNavigate={onNavigate} />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 ml-auto">
          <DesktopDownloadLink />
          <NotificationsButton onNavigate={onNavigate} />
          <button
            onClick={onSettings}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.55)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.55)";
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── Nav items data ──────────────────────────────────────────────── */

export const NAV_ITEMS: NavItem[] = [
  { id: "inventory", label: "Current Inventory", desc: "Browse all items", Icon: Package },
  { id: "map", label: "Inventory Map", desc: "Visualize locations", Icon: Map },
  { id: "rooms", label: "Rooms", desc: "Manage spaces", Icon: Home },
  { id: "categories", label: "Categories", desc: "Organize by type", Icon: Tag },
  { id: "add", label: "Add New Item", desc: "Log something new", Icon: Plus, highlight: true },
  { id: "wishlist", label: "Wishlist", desc: "Needed & wanted", Icon: Heart },
  { id: "reports", label: "Reports", desc: "Stats & insights", Icon: BarChart2 },
];

/* ── NavStrip ────────────────────────────────────────────────────── */

export interface NavStripProps {
  active: string;
  onSelect: (id: string) => void;
}

export function NavStrip({ active, onSelect }: NavStripProps) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        const isHL = item.highlight;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={[
              "flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-150 text-left",
              isHL
                ? "bg-accent text-accent-foreground border-accent hover:bg-accent/90 shadow-sm"
                : isActive
                  ? "bg-card border-accent/40 text-foreground shadow-sm ring-1 ring-accent/20"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:shadow-sm",
            ].join(" ")}
          >
            <div
              className={[
                "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                isHL ? "bg-white/20" : isActive ? "bg-accent/10" : "bg-muted",
              ].join(" ")}
            >
              <item.Icon size={14} className={isHL ? "text-white" : isActive ? "text-accent" : ""} />
            </div>
            <div>
              <div
                className={[
                  "text-sm font-semibold leading-tight",
                  isHL ? "text-white" : isActive ? "text-foreground" : "",
                ].join(" ")}
              >
                {item.label}
              </div>
              <div
                className={[
                  "text-[11px] leading-tight mt-0.5",
                  isHL ? "text-white/70" : "text-muted-foreground/70",
                ].join(" ")}
              >
                {item.desc}
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
