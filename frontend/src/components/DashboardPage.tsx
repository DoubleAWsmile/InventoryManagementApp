import { useState } from "react";
import BarChartSimple from "./BarChartSimple";
import {
  Plus, CheckCircle, ArrowUpRight, ChevronRight,
  Package, Home, Activity, TrendingUp, Clock,
  Headphones, Wrench, Plug, Shirt, Box,
} from "lucide-react";

import { TopNav, NavStrip, NAV_ITEMS } from "./TopNav";
import StatCard from "./StatCard";
import { CompactItemCard } from "./ItemCard";
import type { PageName } from "../types";
import type { StatCardProps as StatCardData } from "./StatCard";
import { useTheme } from "../theme/ThemeContext";

/* ── Dashboard-specific data ─────────────────────────────────────── */

const roomData = [
  { room: "Living Rm", count: 52 }, { room: "Kitchen", count: 45 },
  { room: "Bedroom", count: 38 }, { room: "Garage", count: 41 },
  { room: "Office", count: 34 }, { room: "Bathroom", count: 18 },
  { room: "Closet", count: 12 }, { room: "Basement", count: 8 },
];

const categoryBreakdown = [
  { name: "Electronics", count: 68, pct: 27 },
  { name: "Tools", count: 41, pct: 17 },
  { name: "Clothing", count: 35, pct: 14 },
  { name: "Kitchenware", count: 29, pct: 12 },
  { name: "Cables & Acc.", count: 22, pct: 9 },
  { name: "Other", count: 53, pct: 21 },
];

const categoryColors = ["#3F5FE0", "#F59E0B", "#A855F7", "#EC4899", "#38BDF8", "#E5E4E0"];

const recentActivity = [
  { action: "Added", item: "Sony WH-1000XM5 Headphones", location: "Bedroom", time: "2h ago", Icon: Plus, color: "text-emerald-600 bg-emerald-50" },
  { action: "Updated", item: "AA Batteries — qty changed to 24", location: "Kitchen", time: "5h ago", Icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
  { action: "Moved", item: "Tool Kit", location: "Garage", time: "Yesterday", Icon: ArrowUpRight, color: "text-amber-600 bg-amber-50" },
  { action: "Added", item: "Winter Jacket", location: "Closet", time: "2 days ago", Icon: Plus, color: "text-emerald-600 bg-emerald-50" },
];

const recentlyAddedItems = [
  { id: 1, name: "Sony WH-1000XM5 Headphones", room: "Bedroom", category: "Electronics", qty: 1, Icon: Headphones, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { id: 2, name: "Tool Kit (20-Piece Set)", room: "Garage", category: "Tools", qty: 1, Icon: Wrench, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { id: 3, name: "HDMI 2.1 Cable 6ft", room: "Office", category: "Cables", qty: 3, Icon: Plug, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  { id: 4, name: "Winter Jacket — North Face", room: "Closet", category: "Clothing", qty: 1, Icon: Shirt, iconBg: "bg-pink-50", iconColor: "text-pink-600" },
  { id: 5, name: "USB-C 8-in-1 Hub", room: "Office", category: "Electronics", qty: 2, Icon: Box, iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
  { id: 6, name: "Ninja Air Fryer 5.5qt", room: "Kitchen", category: "Appliances", qty: 1, Icon: Package, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
];

const stats: StatCardData[] = [
  { label: "Total Items", value: "248", Icon: Package, sub: "+12 this month", iconBg: "bg-blue-50", iconColor: "text-blue-600", trend: "up" },
  { label: "Estimated Value", value: "$12,430", Icon: TrendingUp, sub: "+$320 this month", iconBg: "bg-emerald-50", iconColor: "text-emerald-600", trend: "up" },
  { label: "Rooms Tracked", value: "8", Icon: Home, sub: "All rooms active", iconBg: "bg-violet-50", iconColor: "text-violet-600", trend: "neutral" },
  { label: "Missing Info", value: "17", Icon: Activity, sub: "Needs attention", iconBg: "bg-amber-50", iconColor: "text-amber-600", trend: "warn" },
  { label: "Added This Month", value: "12", Icon: Clock, sub: "Last 30 days", iconBg: "bg-pink-50", iconColor: "text-pink-600", trend: "up" },
];


/* ── Component ───────────────────────────────────────────────────── */

export interface DashboardPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName, query?: string) => void;
  onItemSelect?: (id: number) => void;
  onSettings?: () => void;
}

export default function DashboardPage({
  onSignOut,
  onNavigate,
  onItemSelect,
  onSettings,
}: DashboardPageProps) {
  const { tokens } = useTheme();
  const [activeNav, setActiveNav] = useState("inventory");

  function handleNavSelect(id: string) {
    setActiveNav(id);
    const pageMap: Record<string, import("../types").PageName> = {
      inventory: "allItems",
      map: "map",
      rooms: "rooms",
      categories: "categories",
      add: "addItem",
      wishlist: "wishlist",
      reports: "reports",
    };
    const page = pageMap[id];
    if (page) onNavigate(page);
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Figtree', sans-serif" }}
    >
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-7">

        {/* Nav strip — uses FeatureCard internally */}
        <NavStrip active={activeNav} onSelect={handleNavSelect} />

        {/* Welcome header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-0.5 tracking-widest uppercase">
              Dashboard
            </p>
            <h1
              className="text-[28px] font-bold text-foreground leading-tight"
              style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}
            >
              Welcome back, Sarah
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {"Here's a quick overview of your home inventory."}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate("allItems")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <Package size={14} />
              View Inventory
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm">
              <Plus size={14} />
              Add Item
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-5 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Analytics row */}
        <div className="grid grid-cols-[1fr_380px] gap-5">

          {/* Bar chart */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">Items by Room</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Distribution across 8 tracked rooms</p>
              </div>
              <button className="text-xs text-accent font-medium flex items-center gap-1 hover:underline">
                View all <ChevronRight size={12} />
              </button>
            </div>
            <BarChartSimple
              data={roomData.map((d) => ({ label: d.room, value: d.count }))}
              height={220}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Category breakdown */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Category Breakdown</h2>
                <span className="text-[11px] text-muted-foreground">248 items</span>
              </div>
              <div className="space-y-2.5">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryColors[i] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground truncate">{cat.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0">{cat.count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.pct}%`, backgroundColor: categoryColors[i] }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground w-8 text-right flex-shrink-0">
                      {cat.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
                <button className="text-[11px] text-accent font-medium hover:underline">See all</button>
              </div>
              <div className="space-y-3">
                {recentActivity.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${act.color}`}>
                      <act.Icon size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium leading-snug truncate">
                        {act.action} <span className="font-semibold">"{act.item}"</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {act.location} · {act.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recently added items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recently Added Items</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Logged in the past 30 days</p>
            </div>
            <button
              onClick={() => onNavigate("allItems")}
              className="text-xs text-accent font-medium flex items-center gap-1 hover:underline"
            >
              View all items <ChevronRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
            {recentlyAddedItems.map((item) => (
              <CompactItemCard
                key={item.id}
                {...item}
                onClick={() => onItemSelect?.(item.id)}
              />
            ))}
          </div>
        </div>

        <div className="h-4" />
      </main>

      <style>{`
        .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
