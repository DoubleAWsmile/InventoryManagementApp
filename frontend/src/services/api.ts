import { apiFetch } from "./apiClient";

export interface User {
  email: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
}

export interface UserSettings {
  notifyLowStock: boolean;
  notifyWarrantyExpiry: boolean;
  notifyMissingInfo: boolean;
  notifyMonthlySummary: boolean;
  notifyNewFeatures: boolean;
  notifySecurityAlerts: boolean;
  defaultInventoryView: "grid" | "list";
  defaultInventorySort: "addedDate" | "name" | "category" | "room" | "value" | "qty";
  currencyCode: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
  showInventoryValues: boolean;
  showLowStockBadges: boolean;
  showMissingInfoBadges: boolean;
  uiPreferences: {
    themeId?: string;
    useSystemTheme?: boolean;
    density?: "compact" | "comfortable" | "spacious";
    fontSize?: number;
    accentColor?: string | null;
    reduceMotion?: boolean;
    autoSave?: boolean;
    telemetry?: boolean;
    developerMode?: boolean;
    integrations?: string[];
  };
}

export interface ApiItem {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  roomId: string;
  roomLocation: string;
  quantity: number;
  estimatedValue?: number;
  purchaseDate?: string;
  condition?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  notes?: string;
  photoUrl?: string;
  photoFilename?: string;
  photoMimeType?: string;
  photoSizeBytes?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  name: string;
  categoryId: string | null;
  roomId: string | null;
  quantity: number;
  estimatedValue: number | null;
  purchaseDate: string | null;
  condition: string;
  brand: string;
  model: string;
  serialNumber: string;
  description: string;
  notes: string;
  photoUrl: string;
  photoFilename: string;
  photoMimeType: string;
  photoSizeBytes: number | null;
  tags: string[];
}

export interface ItemOption {
  id: string;
  name: string;
}

export interface ItemOptions {
  categories: ItemOption[];
  rooms: ItemOption[];
}

export interface ApiCategory {
  id: string;
  name: string;
  itemCount: number;
  estimatedValue: number;
  topRoom: string;
}

export interface ApiRoom {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  estimatedValue: number;
  recentItem: string;
  missingInfo: boolean;
}

export interface DashboardSummary {
  totalItems: number;
  estimatedValue: number;
  roomsTracked: number;
  missingInfo: number;
  addedThisMonth: number;
  valueAddedThisMonth: number;
  rooms: { id: string; name: string; count: number }[];
  categories: { id: string; name: string; count: number }[];
  recentActivity: { itemId: string; itemName: string; roomName: string; type: number; createdAt: string }[];
}

export type WishlistPriority = "low" | "medium" | "high";
export type WishlistStatus = "wanted" | "considering" | "purchased" | "cancelled";
export interface WishlistItem {
  id: string;
  categoryId: string;
  category: string;
  itemName: string;
  brand: string;
  model: string;
  estimatedCost: number | null;
  itemUrl: string;
  notes: string;
  priority: WishlistPriority;
  status: WishlistStatus;
  createdAt: string;
  updatedAt: string;
}
export type WishlistPayload = Pick<
  WishlistItem,
  | "categoryId"
  | "itemName"
  | "brand"
  | "model"
  | "estimatedCost"
  | "itemUrl"
  | "notes"
  | "priority"
  | "status"
>;
export interface ReportBreakdown {
  id: string;
  name: string;
  count: number;
  value: number;
}
export interface MissingInfoItem {
  id: string;
  name: string;
  room: string;
  missing: string[];
}
export interface ReportSummary {
  totalItems: number;
  estimatedValue: number;
  addedThisMonth: number;
  missingInfoTotal: number;
  rooms: ReportBreakdown[];
  categories: ReportBreakdown[];
  missingInfo: MissingInfoItem[];
  recentActivity: { itemId: string; itemName: string; roomName: string; type: number; createdAt: string }[];
}

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

export function createUser(email: string, displayName: string, password: string) {
  return apiFetch<User>("/api/users", {
    method: "POST",
    body: JSON.stringify({ email, displayName, password }),
  });
}

export async function deleteMe(email: string, password: string): Promise<void> {
  return apiFetch<void>("/api/me", {
    method: "DELETE",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return apiFetch<User>("/api/me");
}

export function getSettings() {
  return apiFetch<UserSettings>("/api/settings");
}

export function updateSettings(settings: UserSettings) {
  return apiFetch<UserSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export function resetSettings() {
  return apiFetch<UserSettings>("/api/settings", { method: "DELETE" });
}

export function fetchItems(cursor?: string, limit = 24) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<CursorPage<ApiItem>>(`/api/items?${params.toString()}`);
}

export async function fetchAllItems() {
  const items: ApiItem[] = [];
  let cursor: string | undefined;
  do {
    const page = await fetchItems(cursor, 100);
    items.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return items;
}

export function getDashboard() {
  return apiFetch<DashboardSummary>("/api/dashboard");
}
export function getReports() {
  return apiFetch<ReportSummary>("/api/reports");
}
export function getWishlist() {
  return apiFetch<WishlistItem[]>("/api/wishlist");
}
export function createWishlistItem(payload: WishlistPayload) {
  return apiFetch<WishlistItem>("/api/wishlist", { method: "POST", body: JSON.stringify(payload) });
}
export function updateWishlistItem(id: string, payload: WishlistPayload) {
  return apiFetch<WishlistItem>(`/api/wishlist/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export function deleteWishlistItem(id: string) {
  return apiFetch<void>(`/api/wishlist/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getRecentItems(limit = 6) {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiFetch<ApiItem[]>(`/api/items/recent?${params.toString()}`);
}

export function getItemOptions() {
  return apiFetch<ItemOptions>("/api/items/options");
}

export function getCategories() {
  return apiFetch<ApiCategory[]>("/api/categories");
}
export function createCategory(name: string) {
  return apiFetch<ApiCategory>("/api/categories", { method: "POST", body: JSON.stringify({ name }) });
}
export function createRecommendedCategories(names: string[]) {
  return apiFetch<ApiCategory[]>("/api/categories/recommended", {
    method: "POST",
    body: JSON.stringify({ names }),
  });
}
export function deleteCategory(categoryId: string) {
  return apiFetch<void>(`/api/categories/${encodeURIComponent(categoryId)}`, { method: "DELETE" });
}
export function getRooms() {
  return apiFetch<ApiRoom[]>("/api/rooms");
}
export function createRoom(name: string, description: string) {
  return apiFetch<ApiRoom>("/api/rooms", { method: "POST", body: JSON.stringify({ name, description }) });
}
export function deleteRoom(roomId: string) {
  return apiFetch<void>(`/api/rooms/${encodeURIComponent(roomId)}`, { method: "DELETE" });
}

export function createItem(payload: CreateItemPayload) {
  return apiFetch<ApiItem>("/api/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateItem(itemId: string, payload: CreateItemPayload) {
  return apiFetch<ApiItem>(`/api/items/${encodeURIComponent(itemId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteItem(itemId: string | number) {
  return apiFetch<void>(`/api/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}
