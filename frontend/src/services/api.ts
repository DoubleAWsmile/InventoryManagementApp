import { apiFetch } from "./apiClient";

export interface User {
  email: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
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
  id: string; name: string; itemCount: number; estimatedValue: number; topRoom: string;
}

export interface ApiRoom {
  id: string; name: string; description: string; itemCount: number;
  estimatedValue: number; recentItem: string; missingInfo: boolean;
}

export interface DashboardSummary {
  totalItems: number; estimatedValue: number; roomsTracked: number; missingInfo: number;
  addedThisMonth: number; valueAddedThisMonth: number;
  rooms: { id: string; name: string; count: number }[];
  categories: { id: string; name: string; count: number }[];
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

export function getCurrentUser() { return apiFetch<User>("/api/me"); }

export function fetchItems(cursor?: string, limit = 24) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<CursorPage<ApiItem>>(`/api/items?${params.toString()}`);
}

export function getDashboard() { return apiFetch<DashboardSummary>("/api/dashboard"); }

export function getRecentItems(limit = 6) {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiFetch<ApiItem[]>(`/api/items/recent?${params.toString()}`);
}

export function getItemOptions() {
  return apiFetch<ItemOptions>("/api/items/options");
}

export function getCategories() { return apiFetch<ApiCategory[]>("/api/categories"); }
export function createCategory(name: string) {
  return apiFetch<ApiCategory>("/api/categories", { method: "POST", body: JSON.stringify({ name }) });
}
export function createRecommendedCategories(names: string[]) {
  return apiFetch<ApiCategory[]>("/api/categories/recommended", {
    method: "POST", body: JSON.stringify({ names }),
  });
}
export function deleteCategory(categoryId: string) {
  return apiFetch<void>(`/api/categories/${encodeURIComponent(categoryId)}`, { method: "DELETE" });
}
export function getRooms() { return apiFetch<ApiRoom[]>("/api/rooms"); }
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
