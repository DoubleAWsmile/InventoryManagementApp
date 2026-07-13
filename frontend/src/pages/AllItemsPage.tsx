import { useEffect, useState, useMemo } from "react";
import {
  Plus, ChevronRight, ChevronDown, Home, MoreHorizontal,
  Search, X, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle,
  LayoutGrid, List, SlidersHorizontal, Download, Filter,
  Package,
} from "lucide-react";

import { TopNav, NavStrip } from "../components/TopNav";
import { FullItemCard } from "../components/ItemCard";
import { CATEGORY_COLORS, TAG_COLORS, PAGE_SIZE, toDisplayItem } from "../data/items";
import type { Item, PageName } from "../types";
import { NAV_ID_TO_PAGE } from "../utils/nav";
import { useInventoryPrefs } from "../context/InventoryPrefsContext";
import { getItems } from "../services/api";

/* ── Sort options ────────────────────────────────────────────────── */

const SORT_OPTIONS = [
  { value: "name", label: "Item Name" },
  { value: "category", label: "Category" },
  { value: "room", label: "Room" },
  { value: "addedDate", label: "Added Date" },
  { value: "updatedDate", label: "Updated Date" },
  { value: "qty", label: "Quantity" },
  { value: "value", label: "Estimated Value" },
];

/* ── Component ───────────────────────────────────────────────────── */

export interface AllItemsPageProps {
  userId: string;
  onBack: () => void;
  onSignOut: () => void;
  onItemSelect: (item: Item) => void;
  onSettings?: () => void;
  onNavigate?: (page: PageName, query?: string) => void;
}

export default function AllItemsPage({
  userId,
  onBack,
  onSignOut,
  onItemSelect,
  onSettings,
  onNavigate,
}: AllItemsPageProps) {
  const {
    defaultView, defaultSort,
    currencySymbol, showValues, showLowStock: prefShowLowStock, showMissingInfo: prefShowMissingInfo,
  } = useInventoryPrefs();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(defaultSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultView);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showMissingInfo, setShowMissingInfo] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortOpen, setSortOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    getItems(userId)
      .then((responseItems) => {
        if (active) setItems(responseItems.map(toDisplayItem));
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError instanceof Error ? requestError.message : "Unable to load inventory.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [userId]);

  const allCategories = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items]);
  const allRooms = useMemo(() => [...new Set(items.map((i) => i.room))].sort(), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let filteredItems = items.filter((item) => {
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.room.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return (
        matchSearch &&
        (!activeCategory || item.category === activeCategory) &&
        (!activeRoom || item.room === activeRoom) &&
        (!showLowStock || item.lowStock) &&
        (!showMissingInfo || item.missingInfo)
      );
    });

    return [...filteredItems].sort((a, b) => {
      let vA: string | number = a.id;
      let vB: string | number = b.id;
      if (sortBy === "name") { vA = a.name; vB = b.name; }
      else if (sortBy === "category") { vA = a.category; vB = b.category; }
      else if (sortBy === "room") { vA = a.room; vB = b.room; }
      else if (sortBy === "addedDate") { vA = Date.parse(a.addedDate); vB = Date.parse(b.addedDate); }
      else if (sortBy === "updatedDate") { vA = Date.parse(a.updatedDate); vB = Date.parse(b.updatedDate); }
      else if (sortBy === "qty") { vA = a.qty; vB = b.qty; }
      else if (sortBy === "value") { vA = a.value; vB = b.value; }
      if (typeof vA === "string") {
        const c = (vA as string).localeCompare(vB as string);
        return sortDir === "asc" ? c : -c;
      }
      return sortDir === "asc" ? (vA as number) - (vB as number) : (vB as number) - (vA as number);
    });
  }, [items, search, activeCategory, activeRoom, showLowStock, showMissingInfo, sortBy, sortDir]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const activeFilterCount = [activeCategory, activeRoom, showLowStock && "l", showMissingInfo && "m"].filter(Boolean).length;

  const catColor = (cat: string) =>
    CATEGORY_COLORS[cat] ?? "bg-slate-50 text-slate-700 border-slate-200";

  function clearFilters() {
    setActiveCategory(null);
    setActiveRoom(null);
    setShowLowStock(false);
    setShowMissingInfo(false);
  }

  function resetAndNav() {
    clearFilters();
    setSearch("");
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Figtree', sans-serif" }}
    >
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">

        {/* Nav strip */}
        <NavStrip active="inventory" onSelect={(id) => {
          if (id === "inventory") return;
          const p = NAV_ID_TO_PAGE[id];
          if (p && onNavigate) onNavigate(p);
          else onBack();
        }} />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={onBack} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">All Items</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-[26px] font-bold text-foreground leading-tight"
              style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}
            >
              All Items
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Browse and manage everything in your inventory.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
              <Download size={14} />Export
            </button>
            <button className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
              <SlidersHorizontal size={14} />Bulk Actions
            </button>
            <button onClick={() => onNavigate?.("addItem")} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm">
              <Plus size={14} />Add Item
            </button>
          </div>
        </div>

        {(loading || loadError) && (
          <div className={`px-4 py-3 rounded-xl border text-sm ${loadError ? "bg-red-50 border-red-200 text-red-700" : "bg-muted/40 border-border text-muted-foreground"}`}>
            {loadError ?? "Loading inventory…"}
          </div>
        )}

        {/* Controls bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Search items…"
              className="w-full h-9 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
              style={{ paddingLeft: "2rem", paddingRight: search ? "2rem" : "1rem" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <ArrowUpDown size={13} className="text-muted-foreground" />
              Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
            {sortOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[180px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); setVisibleCount(PAGE_SIZE); }}
                    className={["w-full flex items-center justify-between px-3.5 py-2 text-sm hover:bg-muted transition-colors text-left", sortBy === opt.value ? "text-accent font-semibold" : "text-foreground"].join(" ")}
                  >
                    {opt.label}
                    {sortBy === opt.value && <CheckCircle size={13} className="text-accent" />}
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button onClick={() => { setSortDir("asc"); setSortOpen(false); }} className={["w-full flex items-center gap-2 px-3.5 py-2 text-sm hover:bg-muted text-left", sortDir === "asc" ? "text-accent font-semibold" : "text-foreground"].join(" ")}><ArrowUp size={12} /> Ascending</button>
                  <button onClick={() => { setSortDir("desc"); setSortOpen(false); }} className={["w-full flex items-center gap-2 px-3.5 py-2 text-sm hover:bg-muted text-left", sortDir === "desc" ? "text-accent font-semibold" : "text-foreground"].join(" ")}><ArrowDown size={12} /> Descending</button>
                </div>
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center h-9 rounded-lg border border-border bg-card p-0.5 shadow-sm">
            <button onClick={() => setViewMode("grid")} className={["w-8 h-8 flex items-center justify-center rounded-md transition-all", viewMode === "grid" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setViewMode("list")} className={["w-8 h-8 flex items-center justify-center rounded-md transition-all", viewMode === "list" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}>
              <List size={14} />
            </button>
          </div>

          {/* Result count */}
          <div className="ml-auto text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> of {items.length} items
          </div>
        </div>

        {/* Filter strips */}
        <div className="space-y-2.5">
          {/* Category row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mr-1" style={{ letterSpacing: "0.08em" }}>
              <Filter size={10} />Category
            </div>
            <button
              onClick={() => { setActiveCategory(null); setVisibleCount(PAGE_SIZE); }}
              className={["h-7 px-3 rounded-full text-xs font-semibold border transition-all", !activeCategory ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"].join(" ")}
            >All</button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(activeCategory === cat ? null : cat); setVisibleCount(PAGE_SIZE); }}
                className={["h-7 px-3 rounded-full text-xs font-semibold border transition-all", activeCategory === cat ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border hover:border-accent/40 hover:text-foreground"].join(" ")}
              >{cat}</button>
            ))}
          </div>

          {/* Room + status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mr-1" style={{ letterSpacing: "0.08em" }}>
              <Home size={10} />Room
            </div>
            <button
              onClick={() => { setActiveRoom(null); setVisibleCount(PAGE_SIZE); }}
              className={["h-7 px-3 rounded-full text-xs font-semibold border transition-all", !activeRoom ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"].join(" ")}
            >All</button>
            {allRooms.map((room) => (
              <button
                key={room}
                onClick={() => { setActiveRoom(activeRoom === room ? null : room); setVisibleCount(PAGE_SIZE); }}
                className={["h-7 px-3 rounded-full text-xs font-semibold border transition-all", activeRoom === room ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border hover:border-accent/40 hover:text-foreground"].join(" ")}
              >{room}</button>
            ))}

            <div className="w-px h-5 bg-border mx-1" />

            <button
              onClick={() => { setShowLowStock((v) => !v); setVisibleCount(PAGE_SIZE); }}
              className={["h-7 px-3 rounded-full text-xs font-semibold border transition-all", showLowStock ? "bg-amber-500 text-white border-amber-500" : "bg-card text-muted-foreground border-border hover:border-amber-300 hover:text-amber-600"].join(" ")}
            >Low Stock</button>
            <button
              onClick={() => { setShowMissingInfo((v) => !v); setVisibleCount(PAGE_SIZE); }}
              className={["h-7 px-3 rounded-full text-xs font-semibold border transition-all", showMissingInfo ? "bg-red-500 text-white border-red-500" : "bg-card text-muted-foreground border-border hover:border-red-300 hover:text-red-500"].join(" ")}
            >Missing Info</button>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="h-7 px-3 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                <X size={11} />Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Grid view ────────────────────────────────────────────── */}
        {viewMode === "grid" && (
          visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Package size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No items found</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Try adjusting your search or filter criteria.</p>
              <button onClick={resetAndNav} className="mt-4 text-sm text-accent font-medium hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((item) => (
                <FullItemCard
                  key={item.id}
                  {...item}
                  value={showValues ? item.value : undefined}
                  lowStock={prefShowLowStock ? item.lowStock : false}
                  missingInfo={prefShowMissingInfo ? item.missingInfo : false}
                  currencySymbol={currencySymbol}
                  onClick={() => onItemSelect(item)}
                />
              ))}
            </div>
          )
        )}

        {/* ── List view ────────────────────────────────────────────── */}
        {viewMode === "list" && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Table header */}
            <div
              className="grid items-center px-5 py-3 border-b border-border bg-muted/40"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 60px 80px 120px 32px" }}
            >
              {["Item", "Category", "Room", "Qty", "Value", "Added", ""].map((h) => (
                <div key={h} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest" style={{ letterSpacing: "0.07em" }}>
                  {h}
                </div>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={22} className="text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground">No items found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              visible.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onItemSelect(item)}
                  className={["grid items-center px-5 py-3.5 group cursor-pointer hover:bg-muted/30 transition-colors", idx !== visible.length - 1 ? "border-b border-border/50" : ""].join(" ")}
                  style={{ gridTemplateColumns: "2fr 1fr 1fr 60px 80px 120px 32px" }}
                >
                  {/* Name + icon + tags */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                      <item.Icon size={15} className={item.iconColor} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
                        {prefShowLowStock && item.lowStock && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 flex-shrink-0">LOW</span>}
                        {prefShowMissingInfo && item.missingInfo && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 flex-shrink-0">INFO</span>}
                      </div>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {item.tags.map((tag, i) => (
                          <span key={tag} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit ${catColor(item.category)}`}>
                    {item.category}
                  </span>

                  {/* Room */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Home size={11} className="flex-shrink-0" />
                    <span className="truncate">{item.room}</span>
                  </div>

                  {/* Qty */}
                  <span className="text-sm font-semibold text-foreground">{item.qty}</span>

                  {/* Value */}
                  <span className="text-sm text-foreground">
                    {showValues ? `${currencySymbol}${item.value}` : "—"}
                  </span>

                  {/* Added */}
                  <span className="text-xs text-muted-foreground">{item.addedDate}</span>

                  {/* Actions */}
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">{Math.min(visibleCount, filtered.length)}</span>
              {" "}of{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span> items
            </p>
            {hasMore ? (
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted hover:shadow-sm transition-all"
              >
                Load more <ChevronDown size={14} className="text-muted-foreground" />
              </button>
            ) : filtered.length > PAGE_SIZE ? (
              <p className="text-xs text-muted-foreground">All items loaded</p>
            ) : null}
          </div>
        )}

        <div className="h-6" />
      </main>

      {/* Click-outside closes sort dropdown */}
      {sortOpen && <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />}

      <style>{`
        .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
