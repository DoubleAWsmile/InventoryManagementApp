import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BarChartSimple from "../components/BarChartSimple";
import {
  Plus, ChevronRight,
  Package, Home, Activity, TrendingUp, Clock,
} from "lucide-react";

import { TopNav, NavStrip } from "../components/TopNav";
import StatCard from "../components/StatCard";
import { CompactItemCard } from "../components/ItemCard";
import type { Item, PageName } from "../types";
import { toDisplayItem } from "../data/items";
import { getDashboard, getRecentItems, type DashboardSummary } from "../services/api";
import { queryKeys } from "../queries/keys";

/* ── Dashboard-specific data ─────────────────────────────────────── */

const categoryColors = ["#3F5FE0", "#F59E0B", "#A855F7", "#EC4899", "#38BDF8", "#E5E4E0"];

const EMPTY_DASHBOARD: DashboardSummary = {
  totalItems: 0, estimatedValue: 0, roomsTracked: 0, missingInfo: 0,
  addedThisMonth: 0, valueAddedThisMonth: 0, rooms: [], categories: [], recentActivity: [],
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return "Yesterday";
  return `${Math.floor(seconds / 86400)} days ago`;
}


/* ── Component ───────────────────────────────────────────────────── */

export interface DashboardPageProps {
  displayName: string;
  onSignOut: () => void;
  onNavigate: (page: PageName, query?: string) => void;
  onItemSelect?: (item: Item) => void;
  onSettings?: () => void;
}

export default function DashboardPage({
  displayName,
  onSignOut,
  onNavigate,
  onItemSelect,
  onSettings,
}: DashboardPageProps) {
  const [activeNav, setActiveNav] = useState("inventory");
	const dashboardQuery = useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard });
	const recentItemsQuery = useQuery({ queryKey: queryKeys.recentItems(6), queryFn: () => getRecentItems(6) });
	const dashboard = dashboardQuery.data ?? EMPTY_DASHBOARD;
	const recentlyAddedItems = (recentItemsQuery.data ?? []).map(toDisplayItem);
	const dashboardError = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null;
	const recentItemsError = recentItemsQuery.error instanceof Error ? recentItemsQuery.error.message : null;
	const recentItemsLoading = recentItemsQuery.isPending;

	const categoryBreakdown = dashboard.categories.map((category) => ({
		...category,
		pct: dashboard.totalItems ? Math.round((category.count / dashboard.totalItems) * 100) : 0,
	}));
	const stats = [
		{ label: "Total Items", value: String(dashboard.totalItems), Icon: Package, sub: `+${dashboard.addedThisMonth} this month`, iconBg: "bg-blue-50", iconColor: "text-blue-600", trend: "up" as const },
		{ label: "Estimated Value", value: `$${dashboard.estimatedValue.toLocaleString()}`, Icon: TrendingUp, sub: `+$${dashboard.valueAddedThisMonth.toLocaleString()} this month`, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", trend: "up" as const },
		{ label: "Rooms Tracked", value: String(dashboard.roomsTracked), Icon: Home, sub: "All rooms active", iconBg: "bg-violet-50", iconColor: "text-violet-600", trend: "neutral" as const },
		{ label: "Missing Info", value: String(dashboard.missingInfo), Icon: Activity, sub: "Needs attention", iconBg: "bg-amber-50", iconColor: "text-amber-600", trend: "warn" as const },
		{ label: "Added This Month", value: String(dashboard.addedThisMonth), Icon: Clock, sub: "Current month", iconBg: "bg-pink-50", iconColor: "text-pink-600", trend: "up" as const },
	];

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
              Welcome back, {displayName || "there"}
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
            <button onClick={() => onNavigate("addItem")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm">
              <Plus size={14} />
              Add Item
            </button>
          </div>
        </div>

        {/* Stat cards */}
		{dashboardError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{dashboardError}</div>}
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
                <p className="text-xs text-muted-foreground mt-0.5">Distribution across {dashboard.roomsTracked} tracked rooms</p>
              </div>
              <button className="text-xs text-accent font-medium flex items-center gap-1 hover:underline">
                View all <ChevronRight size={12} />
              </button>
            </div>
            <BarChartSimple
              data={dashboard.rooms.map((room) => ({ label: room.name, value: room.count }))}
              height={220}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Category breakdown */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Category Breakdown</h2>
                <span className="text-[11px] text-muted-foreground">{dashboard.totalItems} items</span>
              </div>
              <div className="space-y-2.5">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground truncate">{cat.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0">{cat.count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.pct}%`, backgroundColor: categoryColors[i % categoryColors.length] }}
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
                {dashboard.recentActivity.map((activity) => (
                  <div key={`${activity.itemId}-${activity.createdAt}`} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-600 bg-emerald-50">
                      <Plus size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium leading-snug truncate">
                        Added <span className="font-semibold">"{activity.itemName}"</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {activity.roomName || "No room"} · {relativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
				{dashboard.recentActivity.length === 0 && <p className="text-xs text-muted-foreground">No recent activity yet.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Recently added items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recently Added Items</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your 6 most recently logged items</p>
            </div>
            <button
              onClick={() => onNavigate("allItems")}
              className="text-xs text-accent font-medium flex items-center gap-1 hover:underline"
            >
              View all items <ChevronRight size={12} />
            </button>
          </div>

          {(recentItemsLoading || recentItemsError) && (
            <div className={`mb-4 px-4 py-3 rounded-xl border text-sm ${recentItemsError ? "bg-red-50 border-red-200 text-red-700" : "bg-muted/40 border-border text-muted-foreground"}`}>
              {recentItemsError ?? "Loading recently added items…"}
            </div>
          )}
          {!recentItemsLoading && !recentItemsError && recentlyAddedItems.length === 0 && (
            <div className="mb-4 px-4 py-6 rounded-xl border border-border text-sm text-center text-muted-foreground">
              No items have been added yet.
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
            {recentlyAddedItems.map((item) => (
              <CompactItemCard
                key={item.id}
                {...item}
                onClick={() => onItemSelect?.(item)}
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
