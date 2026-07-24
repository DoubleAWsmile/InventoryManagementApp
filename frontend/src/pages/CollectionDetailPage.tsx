import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Home, Package, Tag } from "lucide-react";
import { TopNav, NavStrip } from "../components/TopNav";
import { FullItemCard } from "../components/ItemCard";
import { fetchAllItems, getCategories, getRooms } from "../services/api";
import { toDisplayItem } from "../data/items";
import { queryKeys } from "../queries/keys";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";
import type { Item, PageName } from "../types";

interface Props {
  kind: "category" | "room";
  collectionId: string;
  onItemSelect: (item: Item) => void;
  onSignOut: () => void;
  onNavigate: (page: PageName, value?: string) => void;
  onSettings?: () => void;
}

export default function CollectionDetailPage({
  kind,
  collectionId,
  onItemSelect,
  onSignOut,
  onNavigate,
  onSettings,
}: Props) {
  const metaQuery = useQuery({
    queryKey: kind === "category" ? queryKeys.categories : queryKeys.rooms,
    queryFn: kind === "category" ? getCategories : getRooms,
  });
  const itemsQuery = useQuery({ queryKey: ["search-items"], queryFn: fetchAllItems });
  const collection = metaQuery.data?.find((entry) => entry.id === collectionId);
  const items = useMemo(
    () =>
      (itemsQuery.data ?? [])
        .map(toDisplayItem)
        .filter((item) =>
          kind === "category" ? item.categoryId === collectionId : item.roomId === collectionId,
        ),
    [itemsQuery.data, collectionId, kind],
  );
  const totalValue = items.reduce((sum, item) => sum + item.value * item.qty, 0);
  const listPage: PageName = kind === "category" ? "categories" : "rooms";
  const label = kind === "category" ? "Category" : "Room";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID[listPage]}
          onSelect={(id) => NAV_ID_TO_PAGE[id] && onNavigate(NAV_ID_TO_PAGE[id])}
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground">
            <Home size={14} />
          </button>
          <ChevronRight size={13} />
          <button onClick={() => onNavigate(listPage)} className="hover:text-foreground">
            {label}s
          </button>
          <ChevronRight size={13} />
          <span className="font-medium text-foreground">{collection?.name ?? label}</span>
        </div>
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {kind === "category" ? <Tag /> : <Home />}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
              <h1 className="font-display text-3xl">{collection?.name ?? `Unknown ${label}`}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {items.length} items · ${totalValue.toLocaleString()} estimated value
              </p>
            </div>
          </div>
        </section>
        {itemsQuery.isPending || metaQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <FullItemCard key={item.id} {...item} onClick={() => onItemSelect(item)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <Package className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold">No items in this {kind}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Items assigned here will appear on this page.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
