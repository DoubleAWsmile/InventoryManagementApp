import { useState } from "react";
import {
  Plus, ChevronRight, ShoppingCart, TrendingUp, AlertCircle,
  CheckCircle2, Package, ArrowRight, ChevronDown, X, Star,
} from "lucide-react";
import { TopNav, NavStrip } from "../components/TopNav";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";

type Priority = "Low" | "Medium" | "High";
type Status = "Needed" | "Wanted" | "Planned" | "Purchased";

interface WishItem {
  id: number;
  name: string;
  priority: Priority;
  category: string;
  room: string;
  cost: number;
  notes: string;
  status: Status;
}

const WISH_ITEMS: WishItem[] = [
  { id: 1, name: "Label Maker", priority: "Medium", category: "Tools", room: "Office", cost: 35, notes: "Needed for organizing storage bins", status: "Needed" },
  { id: 2, name: "Storage Bins (Set of 6)", priority: "High", category: "Household Supplies", room: "Garage", cost: 60, notes: "Needed for garage organization", status: "Needed" },
  { id: 3, name: "Backup Hard Drive", priority: "High", category: "Electronics", room: "Office", cost: 120, notes: "Needed for important files", status: "Planned" },
  { id: 4, name: "Extra Phone Charger", priority: "Low", category: "Electronics", room: "Bedroom", cost: 20, notes: "Convenience item", status: "Wanted" },
  { id: 5, name: "Standing Desk Mat", priority: "Medium", category: "Household Supplies", room: "Office", cost: 45, notes: "For standing desk ergonomics", status: "Wanted" },
  { id: 6, name: "Cabinet Lock Set", priority: "High", category: "Safety", room: "Kitchen", cost: 18, notes: "Child safety upgrade", status: "Needed" },
  { id: 7, name: "LED Strip Lights", priority: "Low", category: "Electronics", room: "Bedroom", cost: 25, notes: "For under-bed lighting", status: "Purchased" },
];

const PRIORITY_STYLE: Record<Priority, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

const STATUS_STYLE: Record<Status, string> = {
  Needed: "bg-red-50 text-red-600 border border-red-200",
  Wanted: "bg-blue-50 text-blue-600 border border-blue-200",
  Planned: "bg-violet-50 text-violet-600 border border-violet-200",
  Purchased: "bg-emerald-50 text-emerald-600 border border-emerald-200",
};

export interface WishlistPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function WishlistPage({ onSignOut, onNavigate, onSettings }: WishlistPageProps) {
  const [items, setItems] = useState<WishItem[]>(WISH_ITEMS);
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filteredItems = items.filter((it) => {
    if (filterPriority !== "All" && it.priority !== filterPriority) return false;
    if (filterStatus !== "All" && it.status !== filterStatus) return false;
    if (filterCategory !== "All" && it.category !== filterCategory) return false;
    return true;
  });

  const totalCost = items.reduce((s, it) => s + it.cost, 0);
  const highCount = items.filter((it) => it.priority === "High").length;
  const purchasedCount = items.filter((it) => it.status === "Purchased").length;

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markPurchased = () => {
    setItems((prev) =>
      prev.map((it) => selected.has(it.id) ? { ...it, status: "Purchased" as Status } : it)
    );
    setSelected(new Set());
  };

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID["wishlist"] ?? "wishlist"}
          onSelect={(id) => { const p = NAV_ID_TO_PAGE[id]; if (p) onNavigate(p); }}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Wishlist</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight" style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}>
              Wishlist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Track items you need, want, or plan to replace.</p>
          </div>
          <button
            onClick={() => onNavigate("addItem")}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm"
          >
            <Plus size={14} />Add Wishlist Item
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Items", value: String(items.length), sub: "On wishlist", Icon: ShoppingCart, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
            { label: "Est. Total Cost", value: `$${totalCost}`, sub: "To purchase all", Icon: TrendingUp, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "High Priority", value: String(highCount), sub: "Need attention", Icon: AlertCircle, iconBg: "bg-red-50", iconColor: "text-red-600" },
            { label: "Purchased", value: String(purchasedCount), sub: "Completed", Icon: CheckCircle2, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.iconBg} mb-3`}>
                <s.Icon size={16} className={s.iconColor} />
              </div>
              <div className="text-2xl font-bold text-foreground mb-0.5" style={{ letterSpacing: "-0.03em" }}>{s.value}</div>
              <div className="text-xs font-semibold text-foreground/80">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Priority */}
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="h-8 pl-3 pr-8 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 appearance-none"
            >
              {["All", "High", "Medium", "Low"].map((v) => <option key={v}>{v === "All" ? "All Priorities" : v}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {/* Status */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 pl-3 pr-8 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 appearance-none"
            >
              {["All", "Needed", "Wanted", "Planned", "Purchased"].map((v) => <option key={v}>{v === "All" ? "All Statuses" : v}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {/* Category */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-8 pl-3 pr-8 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 appearance-none"
            >
              {categories.map((v) => <option key={v}>{v === "All" ? "All Categories" : v}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">{selected.size} selected</span>
              <button
                onClick={markPurchased}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
              >
                <CheckCircle2 size={12} />Mark Purchased
              </button>
              <button
                onClick={() => onNavigate("allItems")}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <ArrowRight size={12} />Move to Inventory
              </button>
              <button onClick={() => setSelected(new Set())} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
                <X size={13} className="text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <ShoppingCart size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No items match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting the priority, status, or category filter</p>
            </div>
          )}
          {filteredItems.map((it) => {
            const isSelected = selected.has(it.id);
            return (
              <div
                key={it.id}
                className={[
                  "bg-card rounded-2xl border p-4 shadow-sm transition-all duration-150",
                  isSelected ? "border-accent ring-2 ring-accent/20" : "border-border hover:shadow-md",
                  it.status === "Purchased" ? "opacity-60" : "",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(it.id)}
                    className={[
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      isSelected ? "bg-accent border-accent" : "border-border hover:border-accent/50",
                    ].join(" ")}
                  >
                    {isSelected && <CheckCircle2 size={12} className="text-accent-foreground" />}
                  </button>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-muted-foreground" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={["text-sm font-bold text-foreground", it.status === "Purchased" ? "line-through" : ""].join(" ")}>{it.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${PRIORITY_STYLE[it.priority]}`}>{it.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{it.category} · {it.room}</p>
                    {it.notes && <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">{it.notes}</p>}
                  </div>

                  {/* Cost + status */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-base font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>${it.cost}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_STYLE[it.status]}`}>{it.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-6" />
      </main>
    </div>
  );
}
