export const queryKeys = {
  session: ["session"] as const,
  dashboard: ["dashboard"] as const,
	recentItems: (limit: number) => ["items", "recent", { limit }] as const,
  categories: ["categories"] as const,
  rooms: ["rooms"] as const,
  items: (pageSize: number) => ["items", { pageSize }] as const,
  wishlist: (pageSize: number) => ["wishlist", { pageSize }] as const,
  activities: (pageSize: number) => ["activities", { pageSize }] as const,
};
