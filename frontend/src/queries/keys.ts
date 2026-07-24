export const queryKeys = {
  session: ["session"] as const,
  dashboard: ["dashboard"] as const,
  recentItems: (limit: number) => ["recentItems", { limit }] as const,
  categories: ["categories"] as const,
  rooms: ["rooms"] as const,
  items: ["items"] as const,
  wishlist: ["wishlist"] as const,
  reports: ["reports"] as const,
  activities: (pageSize: number) => ["activities", { pageSize }] as const,
};
