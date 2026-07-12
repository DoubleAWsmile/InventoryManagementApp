import {
  ChevronRight, Download, FileText, TrendingUp, Package,
  AlertCircle, Clock, PieChart, BarChart2, Shield, FileDown,
} from "lucide-react";
import BarChartSimple from "../components/BarChartSimple";
import { TopNav, NavStrip } from "../components/TopNav";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";
import { useTheme } from "../theme/ThemeContext";

const BY_ROOM = [
  { name: "Living Rm", items: 52 },
  { name: "Garage", items: 41 },
  { name: "Kitchen", items: 45 },
  { name: "Office", items: 34 },
  { name: "Bedroom", items: 38 },
  { name: "Utility", items: 18 },
  { name: "Closet", items: 12 },
];

const BY_CATEGORY = [
  { name: "Electronics", items: 34 },
  { name: "Household", items: 31 },
  { name: "Tools", items: 28 },
  { name: "Cables", items: 22 },
  { name: "Clothing", items: 18 },
  { name: "Furniture", items: 15 },
  { name: "Documents", items: 12 },
];

const BY_VALUE = [
  { name: "Electronics", value: 5200 },
  { name: "Furniture", value: 4800 },
  { name: "Tools", value: 1760 },
  { name: "Clothing", value: 890 },
  { name: "Safety", value: 420 },
  { name: "Household", value: 640 },
  { name: "Cables", value: 310 },
];

const RECENT_ACTIVITY = [
  { label: "Sony WH-1000XM5 Headphones added", time: "2 hours ago", type: "add" },
  { label: "USB-C 8-in-1 Hub updated", time: "Yesterday", type: "edit" },
  { label: "DeWalt Power Drill — serial number added", time: "2 days ago", type: "edit" },
  { label: "Ninja Air Fryer added", time: "3 days ago", type: "add" },
  { label: "Bookshelf Speakers (Pair) added", time: "4 days ago", type: "add" },
];

const MISSING_INFO = [
  { name: "Power Drill — DeWalt 20V", room: "Garage", missing: "Serial number, purchase date" },
  { name: "Winter Jacket — North Face", room: "Closet", missing: "Purchase price, condition" },
  { name: "Label Maker (old)", room: "Office", missing: "Brand, model number" },
];

export interface ReportsPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function ReportsPage({ onSignOut, onNavigate, onSettings }: ReportsPageProps) {
  const { tokens } = useTheme();


  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID["reports"] ?? "reports"}
          onSelect={(id) => { const p = NAV_ID_TO_PAGE[id]; if (p) onNavigate(p); }}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Reports</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight" style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}>
              Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Understand your inventory, value, and organization trends.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <FileDown size={13} />Download CSV
            </button>
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm">
              <Download size={13} />Export Report
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Total Items", value: "248", sub: "Across all rooms", Icon: Package, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Total Value", value: "$14,020", sub: "Estimated", Icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
            { label: "Top Category", value: "Electronics", sub: "$5,200 value", Icon: BarChart2, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
            { label: "Missing Info", value: "3", sub: "Items incomplete", Icon: AlertCircle, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
            { label: "Added This Month", value: "12", sub: "New items", Icon: Clock, iconBg: "bg-pink-50", iconColor: "text-pink-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.iconBg} mb-3`}>
                <s.Icon size={15} className={s.iconColor} />
              </div>
              <div className="text-xl font-bold text-foreground mb-0.5" style={{ letterSpacing: "-0.03em" }}>{s.value}</div>
              <div className="text-[11px] font-semibold text-foreground/80">{s.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-5">
          {/* Items by Room */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Items by Room</p>
            <BarChartSimple
              data={BY_ROOM.map((d) => ({ label: d.name, value: d.items }))}
              height={176}
            />
          </div>

          {/* Items by Category */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Items by Category</p>
            <BarChartSimple
              data={BY_CATEGORY.map((d) => ({ label: d.name, value: d.items }))}
              height={176}
              barColor={tokens.accent}
            />
          </div>

          {/* Value by Category */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Value by Category</p>
            <BarChartSimple
              data={BY_VALUE.map((d) => ({ label: d.name, value: d.value }))}
              height={176}
              barColor="#10B981"
              formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
          </div>
        </div>

        {/* Report cards + Activity/Missing */}
        <div className="grid grid-cols-[1fr_340px] gap-5">
          <div className="space-y-5">
            {/* Downloadable reports */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Inventory Summary", desc: "Full list of all items with details", Icon: FileText, color: "bg-blue-50", iconColor: "text-blue-600" },
                { title: "Value Breakdown", desc: "Total value organized by room and category", Icon: PieChart, color: "bg-violet-50", iconColor: "text-violet-600" },
                { title: "Missing Info", desc: "Items with incomplete information", Icon: AlertCircle, color: "bg-amber-50", iconColor: "text-amber-600" },
                { title: "Warranty & Receipts", desc: "Items with warranty data attached", Icon: Shield, color: "bg-emerald-50", iconColor: "text-emerald-600" },
              ].map((card) => (
                <div key={card.title} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color} mb-4`}>
                    <card.Icon size={18} className={card.iconColor} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{card.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{card.desc}</p>
                  <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-border bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                    <Download size={10} />Download
                  </button>
                </div>
              ))}
            </div>

            {/* Missing info table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest" style={{ letterSpacing: "0.08em" }}>Missing Information</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{MISSING_INFO.length} items</span>
              </div>
              {MISSING_INFO.map((it, i) => (
                <div key={it.name} className={["flex items-center gap-4 px-5 py-3.5", i < MISSING_INFO.length - 1 ? "border-b border-border/40" : ""].join(" ")}>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{it.room} · Missing: {it.missing}</p>
                  </div>
                  <button
                    onClick={() => onNavigate("allItems")}
                    className="h-7 px-3 rounded-lg border border-border bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                  >
                    Fix
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest" style={{ letterSpacing: "0.08em" }}>Recent Activity</p>
            </div>
            <div>
              {RECENT_ACTIVITY.map((act, i) => (
                <div key={act.label} className={["flex items-start gap-3 px-5 py-4", i < RECENT_ACTIVITY.length - 1 ? "border-b border-border/40" : ""].join(" ")}>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${act.type === "add" ? "bg-emerald-50" : "bg-blue-50"}`}>
                    {act.type === "add"
                      ? <Package size={13} className="text-emerald-600" />
                      : <FileText size={13} className="text-blue-600" />
                    }
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-snug">{act.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-border">
              <button className="w-full text-center text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
                View Full Activity Log
              </button>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </main>
    </div>
  );
}
