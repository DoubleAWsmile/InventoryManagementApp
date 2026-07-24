import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Home, Package, Search, Tag, X } from "lucide-react";
import { TopNav, NavStrip } from "../components/TopNav";
import { fetchAllItems, getCategories, getRooms } from "../services/api";
import { toDisplayItem } from "../data/items";
import { queryKeys } from "../queries/keys";
import { NAV_ID_TO_PAGE } from "../utils/nav";
import type { Item, PageName } from "../types";

interface Props {
  onSignOut: () => void;
  onNavigate: (page: PageName, value?: string) => void;
  onSettings?: () => void;
  onItemSelect: (item: Item) => void;
  initialQuery?: string;
}

export default function SearchResultsPage({
  onSignOut,
  onNavigate,
  onSettings,
  onItemSelect,
  initialQuery = "",
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const itemsQuery = useQuery({ queryKey: ["search-items"], queryFn: fetchAllItems, staleTime: 300000 });
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: getCategories });
  const roomsQuery = useQuery({ queryKey: queryKeys.rooms, queryFn: getRooms });
  const q = query.trim().toLocaleLowerCase();
  const items = useMemo(
    () =>
      (itemsQuery.data ?? [])
        .map(toDisplayItem)
        .filter(
          (item) =>
            !q ||
            [item.name, item.category, item.room, item.description ?? "", ...item.tags].some((value) =>
              value.toLocaleLowerCase().includes(q),
            ),
        ),
    [itemsQuery.data, q],
  );
  const categories = (categoriesQuery.data ?? []).filter(
    (entry) => !q || entry.name.toLocaleLowerCase().includes(q),
  );
  const rooms = (roomsQuery.data ?? []).filter((entry) => !q || entry.name.toLocaleLowerCase().includes(q));
  const total = items.length + categories.length + rooms.length;
  const loading = itemsQuery.isPending || categoriesQuery.isPending || roomsQuery.isPending;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-7 sm:px-8">
        <NavStrip
          active="inventory"
          onSelect={(id) => NAV_ID_TO_PAGE[id] && onNavigate(NAV_ID_TO_PAGE[id])}
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")}>
            <Home size={14} />
          </button>
          <ChevronRight size={13} />
          <span className="font-medium text-foreground">Search Results</span>
        </div>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-3xl">Search Results</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Searching…"
                : `${total} result${total === 1 ? "" : "s"}${query ? ` for “${query}”` : ""}`}
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search everything…"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-9 text-sm outline-none focus:border-accent"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        {!loading && total === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <Search className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold">Nothing matched your search</p>
            <p className="text-sm text-muted-foreground">Try a broader term or check the spelling.</p>
          </div>
        )}
        {categories.length > 0 && (
          <Group title="Categories" icon={<Tag size={16} />}>
            {categories.map((entry) => (
              <Result
                key={entry.id}
                title={entry.name}
                detail={`${entry.itemCount} items · $${entry.estimatedValue.toLocaleString()} value`}
                onClick={() => onNavigate("categoryDetail", entry.id)}
              />
            ))}
          </Group>
        )}
        {rooms.length > 0 && (
          <Group title="Rooms" icon={<Home size={16} />}>
            {rooms.map((entry) => (
              <Result
                key={entry.id}
                title={entry.name}
                detail={`${entry.itemCount} items${entry.description ? ` · ${entry.description}` : ""}`}
                onClick={() => onNavigate("roomDetail", entry.id)}
              />
            ))}
          </Group>
        )}
        {items.length > 0 && (
          <Group title="Items" icon={<Package size={16} />}>
            {items.map((item) => (
              <Result
                key={item.id}
                title={item.name}
                detail={`${item.category || "Uncategorized"} · ${item.room || "No room"} · Qty ${item.qty}`}
                onClick={() => onItemSelect(item)}
              />
            ))}
          </Group>
        )}
      </main>
    </div>
  );
}

function Group({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4 text-sm font-bold">
        {icon}
        {title}
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  );
}
function Result({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className="text-xs font-semibold text-accent">Open →</span>
    </button>
  );
}
