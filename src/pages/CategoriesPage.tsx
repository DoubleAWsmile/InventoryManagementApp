import { useState } from "react";
import {
  Plus, ChevronRight, Eye, Tag, TrendingUp, Package, AlertCircle,
  Cpu, Wrench, Shirt, FileText, Cable, Shield, ShoppingBag, Armchair,
} from "lucide-react";
import BarChartSimple from "../components/BarChartSimple";
import { TopNav, NavStrip } from "../components/TopNav";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";
import { useTheme } from "../theme/ThemeContext";

interface Category {
  id: string;
  name: string;
  items: number;
  value: number;
  topRoom: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  barColor: string;
}

const CATEGORIES: Category[] = [
  { id: "electronics", name: "Electronics", items: 34, value: 5200, topRoom: "Office", Icon: Cpu, iconBg: "bg-blue-50", iconColor: "text-blue-600", barColor: "#3B82F6" },
  { id: "tools", name: "Tools", items: 28, value: 1760, topRoom: "Garage", Icon: Wrench, iconBg: "bg-amber-50", iconColor: "text-amber-600", barColor: "#F59E0B" },
  { id: "clothing", name: "Clothing", items: 18, value: 890, topRoom: "Bedroom", Icon: Shirt, iconBg: "bg-pink-50", iconColor: "text-pink-600", barColor: "#EC4899" },
  { id: "documents", name: "Documents", items: 12, value: 0, topRoom: "Office", Icon: FileText, iconBg: "bg-slate-50", iconColor: "text-slate-600", barColor: "#64748B" },
  { id: "cables", name: "Cables", items: 22, value: 310, topRoom: "Office", Icon: Cable, iconBg: "bg-violet-50", iconColor: "text-violet-600", barColor: "#8B5CF6" },
  { id: "safety", name: "Safety", items: 9, value: 420, topRoom: "Kitchen", Icon: Shield, iconBg: "bg-red-50", iconColor: "text-red-600", barColor: "#EF4444" },
  { id: "household", name: "Household Supplies", items: 31, value: 640, topRoom: "Utility Room", Icon: ShoppingBag, iconBg: "bg-teal-50", iconColor: "text-teal-600", barColor: "#14B8A6" },
  { id: "furniture", name: "Furniture", items: 15, value: 4800, topRoom: "Living Room", Icon: Armchair, iconBg: "bg-orange-50", iconColor: "text-orange-600", barColor: "#F97316" },
];

export interface CategoriesPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function CategoriesPage({ onSignOut, onNavigate, onSettings }: CategoriesPageProps) {
  const { tokens } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const totalItems = CATEGORIES.reduce((s, c) => s + c.items, 0);
  const totalValue = CATEGORIES.reduce((s, c) => s + c.value, 0);
  const topCat = CATEGORIES.reduce((a, b) => (a.value > b.value ? a : b));
  const detail = selected ? CATEGORIES.find((c) => c.id === selected) : null;

  const chartData = CATEGORIES.map((c) => ({ name: c.name.split(" ")[0], items: c.items }));

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID["categories"] ?? "categories"}
          onSelect={(id) => { const p = NAV_ID_TO_PAGE[id]; if (p) onNavigate(p); }}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Categories</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight" style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}>
              Categories
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Group items by type and purpose.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <Tag size={13} />Manage Tags
            </button>
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm"
            >
              <Plus size={14} />Add Category
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Categories", value: String(CATEGORIES.length), sub: "Active", Icon: Tag, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
            { label: "Top by Value", value: topCat.name, sub: `$${topCat.value.toLocaleString()}`, Icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
            { label: "Total Items", value: String(totalItems), sub: "Across all categories", Icon: Package, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Est. Total Value", value: `$${totalValue.toLocaleString()}`, sub: "All categories", Icon: AlertCircle, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.Icon size={16} className={s.iconColor} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-0.5" style={{ letterSpacing: "-0.03em" }}>{s.value}</div>
              <div className="text-xs font-semibold text-foreground/80">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className={["grid gap-6", detail ? "grid-cols-[1fr_320px]" : "grid-cols-1"].join(" ")}>
          <div className="space-y-6">
            {/* Chart */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Items by Category</p>
              <BarChartSimple
                data={chartData.map((d) => ({ label: d.name, value: d.items }))}
                height={160}
              />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {CATEGORIES.map((cat) => {
                const isSelected = selected === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelected(isSelected ? null : cat.id)}
                    className={[
                      "bg-card rounded-2xl border p-5 shadow-sm cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group",
                      isSelected ? "border-accent ring-2 ring-accent/20 shadow-md" : "border-border",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.iconBg}`}>
                        <cat.Icon size={20} className={cat.iconColor} />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-3">{cat.name}</h3>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Items</p>
                        <p className="text-sm font-bold text-foreground">{cat.items}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Value</p>
                        <p className="text-sm font-bold text-foreground">{cat.value > 0 ? `$${cat.value.toLocaleString()}` : "—"}</p>
                      </div>
                    </div>
                    <div className="mb-4 px-3 py-2 rounded-lg bg-muted/60">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Top Room</p>
                      <p className="text-xs text-foreground font-semibold">{cat.topRoom}</p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigate("allItems"); }}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-accent text-accent-foreground text-[11px] font-semibold hover:bg-accent/90 transition-colors"
                      >
                        <Eye size={10} />View Items
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table view */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest" style={{ letterSpacing: "0.08em" }}>All Categories</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Category", "Items", "Est. Value", "Top Room"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-5 py-3" style={{ letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((cat, i) => (
                    <tr
                      key={cat.id}
                      onClick={() => setSelected(selected === cat.id ? null : cat.id)}
                      className={["border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/40 transition-colors", selected === cat.id ? "bg-accent/5" : ""].join(" ")}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.iconBg}`}>
                            <cat.Icon size={13} className={cat.iconColor} />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground">{cat.items}</td>
                      <td className="px-5 py-3 text-sm text-foreground">{cat.value > 0 ? `$${cat.value.toLocaleString()}` : "—"}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{cat.topRoom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {detail && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className={`h-24 flex items-center justify-center ${detail.iconBg}`}>
                  <detail.Icon size={40} className={detail.iconColor} />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-bold text-foreground">{detail.name}</h2>
                    <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{detail.items} items · {detail.value > 0 ? `$${detail.value.toLocaleString()} est. value` : "No value data"}</p>
                  <div className="space-y-2 mb-5">
                    {[
                      { label: "Item Count", value: String(detail.items) },
                      { label: "Estimated Value", value: detail.value > 0 ? `$${detail.value.toLocaleString()}` : "—" },
                      { label: "Top Room", value: detail.topRoom },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className="text-xs font-semibold text-foreground">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => onNavigate("allItems")}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
                  >
                    <Eye size={14} />View All Items
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAddCategory(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-foreground mb-4">Add New Category</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Category Name</label>
                <input placeholder="e.g. Sports Equipment" className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="flex-1 h-9 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors">Save Category</button>
              <button onClick={() => setShowAddCategory(false)} className="flex-1 h-9 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}
