import { useMemo, useState } from "react";
import {
  Search, X, ChevronDown, ChevronRight, SlidersHorizontal,
  Package, Tag, AlertCircle, TrendingDown, Calendar,
} from "lucide-react";
import { TopNav } from "../components/TopNav";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";
import { NavStrip } from "../components/TopNav";
import FilterChip from "../components/FilterChip";
import type { PageName } from "../types";

/* ── Mock data ───────────────────────────────────────────────────── */

interface SearchItem {
  id: number;
  name: string;
  category: string;
  room: string;
  qty: number;
  value: number;
  addedDate: string;
  tags: string[];
  description: string;
  missingInfo: boolean;
  lowStock: boolean;
  iconBg: string;
  iconColor: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: 1, name: "Sony WH-1000XM5 Headphones", category: "Electronics", room: "Bedroom", qty: 1, value: 348, addedDate: "2024-03-12", tags: ["Audio", "Travel", "Expensive"], description: "Over-ear noise cancelling headphones with 30hr battery life.", missingInfo: false, lowStock: false, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { id: 2, name: "Tool Kit (20-Piece Set)", category: "Tools", room: "Garage", qty: 1, value: 65, addedDate: "2024-01-08", tags: ["Repair", "Frequently Used"], description: "Standard household tool kit with screwdrivers, pliers, and hammer.", missingInfo: true, lowStock: false, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { id: 3, name: "Extra HDMI Cable 6ft", category: "Cables", room: "Office", qty: 3, value: 18, addedDate: "2024-02-20", tags: ["Cable", "Backup"], description: "HDMI 2.1 cable supporting 4K@120Hz.", missingInfo: false, lowStock: false, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  { id: 4, name: "First Aid Kit", category: "Safety", room: "Hall Closet", qty: 1, value: 32, addedDate: "2023-11-05", tags: ["Emergency", "Medical"], description: "Full 200-piece first aid kit with bandages, antiseptic, and gloves.", missingInfo: false, lowStock: false, iconBg: "bg-red-50", iconColor: "text-red-600" },
  { id: 5, name: "AA Batteries (Bulk Pack)", category: "Household", room: "Utility Room", qty: 2, value: 14, addedDate: "2024-04-01", tags: ["Batteries", "Low Stock"], description: "48-pack AA alkaline batteries. Running low — only 2 packs remaining.", missingInfo: false, lowStock: true, iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
  { id: 6, name: "USB-C 8-in-1 Hub", category: "Electronics", room: "Office", qty: 2, value: 55, addedDate: "2024-02-14", tags: ["Work", "Frequently Used"], description: "USB-C hub with HDMI, USB-A, SD card, and Ethernet ports.", missingInfo: false, lowStock: false, iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
  { id: 7, name: "Ninja Air Fryer 5.5qt", category: "Appliances", room: "Kitchen", qty: 1, value: 120, addedDate: "2024-03-28", tags: ["Kitchen", "Cooking"], description: "5.5qt air fryer with 6 cooking functions and dishwasher-safe basket.", missingInfo: false, lowStock: false, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { id: 8, name: "Winter Jacket — North Face", category: "Clothing", room: "Closet", qty: 1, value: 220, addedDate: "2023-10-18", tags: ["Seasonal", "Expensive"], description: "Waterproof insulated winter jacket in navy.", missingInfo: true, lowStock: false, iconBg: "bg-pink-50", iconColor: "text-pink-600" },
  { id: 9, name: "Power Drill — DeWalt 20V", category: "Tools", room: "Garage", qty: 1, value: 159, addedDate: "2023-12-02", tags: ["Power Tool", "Repair"], description: "20V cordless drill with 2 batteries and carrying case.", missingInfo: true, lowStock: false, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { id: 10, name: "Vacuum Cleaner — Dyson V11", category: "Appliances", room: "Hall Closet", qty: 1, value: 599, addedDate: "2023-09-15", tags: ["Cleaning", "Expensive"], description: "Cordless stick vacuum with HEPA filtration and 60min runtime.", missingInfo: false, lowStock: false, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  { id: 11, name: "Yoga Mat", category: "Fitness", room: "Bedroom", qty: 1, value: 45, addedDate: "2024-01-20", tags: ["Fitness", "Frequently Used"], description: "6mm non-slip yoga mat with carrying strap.", missingInfo: false, lowStock: false, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  { id: 12, name: "Coffee Maker — Breville", category: "Appliances", room: "Kitchen", qty: 1, value: 249, addedDate: "2023-08-30", tags: ["Kitchen", "Daily Use"], description: "Programmable 12-cup coffee maker with thermal carafe.", missingInfo: false, lowStock: false, iconBg: "bg-brown-50", iconColor: "text-amber-800" },
];

const CATEGORIES = [...new Set(SEARCH_ITEMS.map((i) => i.category))];
const ROOMS = [...new Set(SEARCH_ITEMS.map((i) => i.room))];
const ALL_TAGS = [...new Set(SEARCH_ITEMS.flatMap((i) => i.tags))];

type SortKey = "relevance" | "name" | "category" | "room" | "date" | "qty" | "value";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "name", label: "Item Name" },
  { value: "category", label: "Category" },
  { value: "room", label: "Room" },
  { value: "date", label: "Date Added" },
  { value: "qty", label: "Quantity" },
  { value: "value", label: "Estimated Value" },
];

/* ── Helpers ─────────────────────────────────────────────────────── */

function matchesQuery(item: SearchItem, q: string) {
  if (!q.trim()) return true;
  const lq = q.toLowerCase();
  return (
    item.name.toLowerCase().includes(lq) ||
    item.category.toLowerCase().includes(lq) ||
    item.room.toLowerCase().includes(lq) ||
    item.description.toLowerCase().includes(lq) ||
    item.tags.some((t) => t.toLowerCase().includes(lq))
  );
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/20 text-accent rounded-sm px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ── Component ───────────────────────────────────────────────────── */

export interface SearchResultsPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName, query?: string) => void;
  onSettings?: () => void;
  initialQuery?: string;
}

export default function SearchResultsPage({ onSignOut, onNavigate, onSettings, initialQuery = "" }: SearchResultsPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterMissing, setFilterMissing] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const hasFilters = !!(filterCategory || filterRoom || filterTags.length || filterMissing || filterLowStock);

  const results = useMemo(() => {
    let pool = SEARCH_ITEMS.filter((item) => {
      if (!matchesQuery(item, query)) return false;
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterRoom && item.room !== filterRoom) return false;
      if (filterTags.length && !filterTags.every((t) => item.tags.includes(t))) return false;
      if (filterMissing && !item.missingInfo) return false;
      if (filterLowStock && !item.lowStock) return false;
      return true;
    });

    switch (sortBy) {
      case "name": return [...pool].sort((a, b) => a.name.localeCompare(b.name));
      case "category": return [...pool].sort((a, b) => a.category.localeCompare(b.category));
      case "room": return [...pool].sort((a, b) => a.room.localeCompare(b.room));
      case "date": return [...pool].sort((a, b) => b.addedDate.localeCompare(a.addedDate));
      case "qty": return [...pool].sort((a, b) => b.qty - a.qty);
      case "value": return [...pool].sort((a, b) => b.value - a.value);
      default: return pool;
    }
  }, [query, sortBy, filterCategory, filterRoom, filterTags, filterMissing, filterLowStock]);

  function toggleTag(tag: string) {
    setFilterTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function clearAll() {
    setFilterCategory(""); setFilterRoom(""); setFilterTags([]);
    setFilterMissing(false); setFilterLowStock(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID["allItems"] ?? "inventory"}
          onSelect={(id) => { const p = NAV_ID_TO_PAGE[id]; if (p) onNavigate(p); }}
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Search Results</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight" style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}>
              Search Results
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {results.length} result{results.length !== 1 ? "s" : ""}
              {query.trim() ? <> for <span className="font-semibold text-foreground">"{query}"</span></> : " — all items"}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-80 flex-shrink-0">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Refine your search..."
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={[
              "flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-semibold transition-colors",
              showFilters || hasFilters
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card border-border text-foreground hover:bg-muted",
            ].join(" ")}
          >
            <SlidersHorizontal size={13} />
            Filters
            {hasFilters && <span className="ml-0.5 h-5 min-w-[20px] px-1 rounded-full bg-accent-foreground/20 text-[10px] font-bold flex items-center justify-center">
              {[filterCategory, filterRoom, ...filterTags, filterMissing && "missing", filterLowStock && "low"].filter(Boolean).length}
            </span>}
          </button>

          {/* Active filter chips */}
          {filterCategory && <FilterChip label={filterCategory} active removable onRemove={() => setFilterCategory("")} />}
          {filterRoom && <FilterChip label={filterRoom} active removable onRemove={() => setFilterRoom("")} />}
          {filterTags.map((t) => <FilterChip key={t} label={t} active removable onRemove={() => toggleTag(t)} />)}
          {filterMissing && <FilterChip label="Missing Info" active removable onRemove={() => setFilterMissing(false)} />}
          {filterLowStock && <FilterChip label="Low Stock" active removable onRemove={() => setFilterLowStock(false)} />}
          {hasFilters && (
            <button onClick={clearAll} className="h-7 px-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <X size={10} />Clear all
            </button>
          )}

          {/* Sort */}
          <div className="relative ml-auto">
            <button
              onClick={() => setShowSortMenu((v) => !v)}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Sort: {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
              <ChevronDown size={13} className="text-muted-foreground" />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-44 bg-card border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                    className={[
                      "w-full text-left px-3.5 py-2 text-sm transition-colors",
                      sortBy === opt.value ? "text-accent font-semibold bg-accent/5" : "text-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-3 gap-5">
              {/* Category */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2" style={{ letterSpacing: "0.08em" }}>Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <FilterChip key={c} label={c} active={filterCategory === c} removable onClick={() => setFilterCategory(filterCategory === c ? "" : c)} onRemove={() => setFilterCategory("")} />
                  ))}
                </div>
              </div>

              {/* Room */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2" style={{ letterSpacing: "0.08em" }}>Room</p>
                <div className="flex flex-wrap gap-1.5">
                  {ROOMS.map((r) => (
                    <FilterChip key={r} label={r} active={filterRoom === r} removable onClick={() => setFilterRoom(filterRoom === r ? "" : r)} onRemove={() => setFilterRoom("")} />
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2" style={{ letterSpacing: "0.08em" }}>Flags</p>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip label="Missing Info" active={filterMissing} removable onClick={() => setFilterMissing((v) => !v)} onRemove={() => setFilterMissing(false)} />
                  <FilterChip label="Low Stock" active={filterLowStock} removable onClick={() => setFilterLowStock((v) => !v)} onRemove={() => setFilterLowStock(false)} />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 mt-3" style={{ letterSpacing: "0.08em" }}>Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TAGS.slice(0, 8).map((t) => (
                    <FilterChip key={t} label={t} active={filterTags.includes(t)} removable onClick={() => toggleTag(t)} onRemove={() => toggleTag(t)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Search size={24} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">No results found</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              No items match <strong>"{query}"</strong>{hasFilters ? " with the current filters." : "."}
            </p>
            {hasFilters && (
              <button onClick={clearAll} className="mt-4 h-9 px-4 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => (
              <ResultCard key={item.id} item={item} query={query} onNavigate={onNavigate} />
            ))}
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}

/* ── Result card ─────────────────────────────────────────────────── */

function ResultCard({
  item,
  query,
  onNavigate,
}: {
  item: SearchItem;
  query: string;
  onNavigate: (page: PageName, query?: string) => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-150 p-5 flex items-start gap-4 group">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
        <Package size={20} className={item.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground leading-snug">
              {highlight(item.name, query)}
            </h3>
            {item.missingInfo && (
              <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex-shrink-0">
                <AlertCircle size={9} />Missing info
              </span>
            )}
            {item.lowStock && (
              <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex-shrink-0">
                <TrendingDown size={9} />Low stock
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigate("itemDetail")}
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors opacity-0 group-hover:opacity-100"
          >
            View Details
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span>{highlight(item.category, query)}</span>
          <span className="text-border">·</span>
          <span>{highlight(item.room, query)}</span>
          <span className="text-border">·</span>
          <span>Qty {item.qty}</span>
          {item.value > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="font-semibold text-foreground">${item.value.toLocaleString()}</span>
            </>
          )}
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {new Date(item.addedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-1">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 h-5 px-2 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                <Tag size={8} />{highlight(tag, query)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
