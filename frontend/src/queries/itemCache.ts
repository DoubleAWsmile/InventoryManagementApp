import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { ApiItem, CursorPage } from "../services/api";
import { queryKeys } from "./keys";

type ItemsCache = InfiniteData<CursorPage<ApiItem>, string | undefined>;

export function addItemToCache(queryClient: QueryClient, createdItem: ApiItem) {
  queryClient.setQueryData<ItemsCache>(queryKeys.items, (current) => {
    if (!current || current.pages.length === 0) return current;
    const pages = current.pages.map((page) => ({
      ...page,
      data: page.data.filter((item) => item.id !== createdItem.id),
    }));
    pages[0] = { ...pages[0], data: [createdItem, ...pages[0].data] };
    return { ...current, pages };
  });

  queryClient.setQueriesData<ApiItem[]>({ queryKey: ["recentItems"] }, (current) =>
    current ? [createdItem, ...current.filter((item) => item.id !== createdItem.id)].slice(0, current.length || 1) : current
  );
}

export function replaceItemInCache(queryClient: QueryClient, updatedItem: ApiItem) {
  queryClient.setQueryData<ItemsCache>(queryKeys.items, (current) => current ? ({
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      data: page.data.map((item) => item.id === updatedItem.id ? updatedItem : item),
    })),
  }) : current);

  queryClient.setQueriesData<ApiItem[]>({ queryKey: ["recentItems"] }, (current) =>
    current?.map((item) => item.id === updatedItem.id ? updatedItem : item)
  );
}

export function removeItemFromCache(queryClient: QueryClient, itemId: string) {
  queryClient.setQueryData<ItemsCache>(queryKeys.items, (current) => current ? ({
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      data: page.data.filter((item) => item.id !== itemId),
    })),
  }) : current);

  queryClient.setQueriesData<ApiItem[]>({ queryKey: ["recentItems"] }, (current) =>
    current?.filter((item) => item.id !== itemId)
  );
}
