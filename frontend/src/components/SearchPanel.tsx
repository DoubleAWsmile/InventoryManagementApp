import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Package, Search, Tag } from "lucide-react";
import { fetchAllItems, getCategories, getRooms } from "../services/api";
import { toDisplayItem } from "../data/items";
import { queryKeys } from "../queries/keys";
import type { PageName } from "../types";

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onViewAll?: (query: string) => void;
  onNavigate?: (page: PageName, value?: string) => void;
}

export default function SearchPanel({ query, onClose, onViewAll, onNavigate }: Props) {
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
            [item.name, item.category, item.room, ...item.tags].some((value) =>
              value.toLocaleLowerCase().includes(q),
            ),
        )
        .slice(0, 5),
    [itemsQuery.data, q],
  );
  const categories = (categoriesQuery.data ?? [])
    .filter((entry) => !q || entry.name.toLocaleLowerCase().includes(q))
    .slice(0, 3);
  const rooms = (roomsQuery.data ?? [])
    .filter((entry) => !q || entry.name.toLocaleLowerCase().includes(q))
    .slice(0, 3);
  const count = items.length + categories.length + rooms.length;

  function go(page: PageName, value: string) {
    onClose();
    onNavigate?.(page, value);
  }

  return (
    <div className="absolute left-1/2 top-[calc(100%+10px)] z-[200] w-[min(620px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="max-h-[430px] overflow-y-auto p-2">
        {(itemsQuery.isPending || categoriesQuery.isPending || roomsQuery.isPending) && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Searching inventory…</p>
        )}
        {!itemsQuery.isPending && !categoriesQuery.isPending && !roomsQuery.isPending && count === 0 && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-3 text-muted-foreground" size={20} />
            <p className="font-semibold">No results found</p>
            <p className="text-xs text-muted-foreground">Try another name, tag, category, or room.</p>
          </div>
        )}
        {categories.length > 0 && (
          <ResultSection title="Categories">
            {categories.map((category) => (
              <ResultButton
                key={category.id}
                icon={<Tag size={15} />}
                title={category.name}
                meta={`${category.itemCount} items`}
                onClick={() => go("categoryDetail", category.id)}
              />
            ))}
          </ResultSection>
        )}
        {rooms.length > 0 && (
          <ResultSection title="Rooms">
            {rooms.map((room) => (
              <ResultButton
                key={room.id}
                icon={<Home size={15} />}
                title={room.name}
                meta={`${room.itemCount} items`}
                onClick={() => go("roomDetail", room.id)}
              />
            ))}
          </ResultSection>
        )}
        {items.length > 0 && (
          <ResultSection title="Items">
            {items.map((item) => (
              <ResultButton
                key={item.id}
                icon={<Package size={15} />}
                title={item.name}
                meta={`${item.category} · ${item.room}`}
                onClick={() => go("itemDetail", String(item.id))}
              />
            ))}
          </ResultSection>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-[11px] text-muted-foreground">Search across items, categories, and rooms</span>
        <button onClick={() => onViewAll?.(query)} className="text-xs font-semibold text-accent">
          View all results →
        </button>
      </div>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-2">
      <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {children}
    </section>
  );
}
function ResultButton({
  icon,
  title,
  meta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/60"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{meta}</span>
      </span>
      <span className="text-xs text-muted-foreground">Open →</span>
    </button>
  );
}
