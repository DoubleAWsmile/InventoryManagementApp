import type { PageName } from "../types";

/** Maps NavStrip item IDs → PageName */
export const NAV_ID_TO_PAGE: Record<string, PageName> = {
  inventory: "allItems",
  map: "map",
  rooms: "rooms",
  categories: "categories",
  add: "addItem",
  wishlist: "wishlist",
  reports: "reports",
};

/** Maps PageName → NavStrip active tab ID */
export const PAGE_TO_NAV_ID: Partial<Record<PageName, string>> = {
  allItems: "inventory",
  itemDetail: "inventory",
  map: "map",
  rooms: "rooms",
  categories: "categories",
  addItem: "add",
  wishlist: "wishlist",
  reports: "reports",
};
