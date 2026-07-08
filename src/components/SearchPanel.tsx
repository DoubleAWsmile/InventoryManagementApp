import { useMemo, useState } from "react";
import {
  Clock, Search, X, ChevronDown, ChevronUp,
  Package, AlertCircle, TrendingDown, Tag,
} from "lucide-react";
import { ALL_ITEMS } from "../data/items";
import FilterChip from "./FilterChip";

/* ── Types ───────────────────────────────────────────────────────── */

interface ActiveFilters {
  category: string;
  room: string;
  tag: string;
  missingInfo: boolean;
  lowStock: boolean;
  valueRange: string;
}

const EMPTY_FILTERS: ActiveFilters = {
  category: "",
  room: "",
  tag: "",
  missingInfo: false,
  lowStock: false,
  valueRange: "",
};

/* ── Static options ──────────────────────────────────────────────── */

const CATEGORIES = ["Electronics", "Tools", "Clothing", "Cables", "Safety", "Household", "Appliances", "Fitness", "Kitchenware", "Outdoor"];
const ROOMS = ["Bedroom", "Office", "Garage", "Kitchen", "Living Room", "Closet", "Utility Room", "Hall Closet"];
const VALUE_RANGES = [{ label: "Under $50", value: "0-50" }, { label: "$50–$200", value: "50-200" }, { label: "$200–$500", value: "200-500" }, { label: "$500+", value: "500+" }];

const RECENT_SEARCHES = ["Sony headphones", "Tool kit garage", "HDMI cable", "First aid kit"];

const SUGGESTED_ITEMS = [
  { name: "Sony WH-1000XM5 Headphones", category: "Electronics", room: "Bedroom", tags: ["Audio", "Travel", "Expensive"], qty: 1 },
  { name: "Tool Kit (20-Piece Set)", category: "Tools", room: "Garage", tags: ["Repair", "Frequently Used"], qty: 1 },
  { name: "Extra HDMI Cable 6ft", category: "Cables", room: "Office", tags: ["Cable", "Backup"], qty: 3 },
  { name: "First Aid Kit", category: "Safety", room: "Hall Closet", tags: ["Emergency", "Medical"], qty: 1 },
  { name: "AA Batteries (Bulk Pack)", category: "Household", room: "Utility Room", tags: ["Batteries", "Low Stock"], qty: 2 },
];

/* ── Helpers ─────────────────────────────────────────────────────── */

function itemMatchesQuery(item: typeof SUGGESTED_ITEMS[number], q: string) {
  const lq = q.toLowerCase();
  return (
    item.name.toLowerCase().includes(lq) ||
    item.category.toLowerCase().includes(lq) ||
    item.room.toLowerCase().includes(lq) ||
    item.tags.some((t) => t.toLowerCase().includes(lq))
  );
}

function itemMatchesFilters(item: typeof SUGGESTED_ITEMS[number], f: ActiveFilters) {
  if (f.category && item.category !== f.category) return false;
  if (f.room && item.room !== f.room) return false;
  if (f.tag && !item.tags.some((t) => t.toLowerCase() === f.tag.toLowerCase())) return false;
  if (f.lowStock && !item.tags.includes("Low Stock")) return false;
  return true;
}

/* ── Component ───────────────────────────────────────────────────── */

interface SearchPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  onViewAll?: (query: string) => void;
}

export default function SearchPanel({ query, onClose, onViewAll }: SearchPanelProps) {
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const setFilter = <K extends keyof ActiveFilters>(key: K, val: ActiveFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: prev[key] === val ? (typeof val === "boolean" ? false : "") as ActiveFilters[K] : val }));

  const clearFilter = <K extends keyof ActiveFilters>(key: K) =>
    setFilters((prev) => ({ ...prev, [key]: (typeof prev[key] === "boolean" ? false : "") as ActiveFilters[K] }));

  const hasActiveFilters = Object.entries(filters).some(([, v]) => v !== "" && v !== false);

  const results = useMemo(() => {
    const pool = query.trim() ? SUGGESTED_ITEMS.filter((it) => itemMatchesQuery(it, query)) : SUGGESTED_ITEMS;
    return pool.filter((it) => itemMatchesFilters(it, filters));
  }, [query, filters]);

  const showRecent = !query.trim() && !hasActiveFilters;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] w-[620px] bg-card border border-border rounded-2xl shadow-2xl z-[200] overflow-hidden"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)" }}
    >
      {/* Quick filters */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-1" style={{ letterSpacing: "0.08em" }}>Filter</span>

          {CATEGORIES.slice(0, 5).map((c) => (
            <FilterChip
              key={c}
              label={c}
              active={filters.category === c}
              removable
              onClick={() => setFilter("category", c)}
              onRemove={() => clearFilter("category")}
            />
          ))}

          <FilterChip
            label="Low Stock"
            active={filters.lowStock}
            removable
            onClick={() => setFilter("lowStock", !filters.lowStock)}
            onRemove={() => clearFilter("lowStock")}
          />
          <FilterChip
            label="Missing Info"
            active={filters.missingInfo}
            removable
            onClick={() => setFilter("missingInfo", !filters.missingInfo)}
            onRemove={() => clearFilter("missingInfo")}
          />

          {hasActiveFilters && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="h-7 px-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <X size={10} />Clear all
            </button>
          )}
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          Advanced filters
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* Room filter */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5" style={{ letterSpacing: "0.08em" }}>Room</p>
              <div className="flex flex-wrap gap-1">
                {ROOMS.map((r) => (
                  <FilterChip
                    key={r}
                    label={r}
                    active={filters.room === r}
                    removable
                    onClick={() => setFilter("room", r)}
                    onRemove={() => clearFilter("room")}
                  />
                ))}
              </div>
            </div>
            {/* Value range filter */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5" style={{ letterSpacing: "0.08em" }}>Estimated Value</p>
              <div className="flex flex-wrap gap-1">
                {VALUE_RANGES.map((r) => (
                  <FilterChip
                    key={r.value}
                    label={r.label}
                    active={filters.valueRange === r.value}
                    removable
                    onClick={() => setFilter("valueRange", r.value)}
                    onRemove={() => clearFilter("valueRange")}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto max-h-[420px]">
        {showRecent ? (
          <>
            {/* Recent searches */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2" style={{ letterSpacing: "0.08em" }}>Recent Searches</p>
              <div className="space-y-0.5">
                {RECENT_SEARCHES.map((s) => (
                  <button
                    key={s}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left group"
                  >
                    <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/50 mx-4" />

            {/* Suggested */}
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2" style={{ letterSpacing: "0.08em" }}>Suggested Items</p>
            </div>
            {SUGGESTED_ITEMS.map((item, i) => (
              <SearchResultRow key={i} item={item} query="" />
            ))}
          </>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Search size={16} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No results found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search term or adjust your filters.
            </p>
            <button
              onClick={() => { setFilters(EMPTY_FILTERS); }}
              className="mt-3 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest" style={{ letterSpacing: "0.08em" }}>
                {results.length} result{results.length !== 1 ? "s" : ""}
                {query.trim() ? ` for "${query}"` : ""}
              </p>
            </div>
            {results.map((item, i) => (
              <SearchResultRow key={i} item={item} query={query} />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono font-semibold">Esc</kbd> to close
        </span>
        <button
          onClick={() => onViewAll ? onViewAll(query) : onClose()}
          className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
        >
          View all results →
        </button>
      </div>
    </div>
  );
}

/* ── Search result row ───────────────────────────────────────────── */

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/20 text-accent rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SearchResultRow({ item, query }: { item: typeof SUGGESTED_ITEMS[number]; query: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left group">
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Package size={14} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug truncate">
          {highlight(item.name, query)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {highlight(item.category, query)} · {highlight(item.room, query)} · Qty {item.qty}
        </p>
        {item.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 h-4 px-1.5 rounded-full bg-accent/10 text-accent text-[9px] font-bold">
                <Tag size={7} />{highlight(tag, query)}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground/50 group-hover:text-accent transition-colors flex-shrink-0">
        Open →
      </span>
    </button>
  );
}
