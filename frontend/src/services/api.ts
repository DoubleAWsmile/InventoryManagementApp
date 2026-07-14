export interface User {
  email: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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
  categoryId: string;
  roomId: string;
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const token = localStorage.getItem("sessionToken");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = (await response.text()).trim();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function createUser(email: string, displayName: string, password: string) {
  return apiRequest<User>("/api/users", {
    method: "POST",
    body: JSON.stringify({ email, displayName, password }),
  });
}

export async function deleteMe(email: string, password: string): Promise<void> {
  const token = localStorage.getItem("sessionToken");

  const response = await fetch(`${API_BASE_URL}/api/me`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const message = (await response.text()).trim();
    throw new Error(message || "Failed to delete account");
  }

  localStorage.removeItem("sessionToken");
  localStorage.removeItem("user");
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem("sessionToken");

  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = (await response.text()).trim();
    throw new Error(message || "Failed to logout");
  }

  localStorage.removeItem("sessionToken");
  localStorage.removeItem("user");
}

export function getItems() {
  return apiRequest<ApiItem[]>("/api/items");
}

export function getDashboard() { return apiRequest<DashboardSummary>("/api/dashboard"); }

export function getRecentItems(limit = 6) {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiRequest<ApiItem[]>(`/api/items/recent?${params.toString()}`);
}

export function getItemOptions() {
  return apiRequest<ItemOptions>("/api/items/options");
}

export function getCategories() { return apiRequest<ApiCategory[]>("/api/categories"); }
export function createCategory(name: string) {
  return apiRequest<ApiCategory>("/api/categories", { method: "POST", body: JSON.stringify({ name }) });
}
export function getRooms() { return apiRequest<ApiRoom[]>("/api/rooms"); }
export function createRoom(name: string, description: string) {
  return apiRequest<ApiRoom>("/api/rooms", { method: "POST", body: JSON.stringify({ name, description }) });
}

export function createItem(payload: CreateItemPayload) {
  return apiRequest<ApiItem>("/api/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteItem(itemId: string | number) {
  return apiRequest<void>(`/api/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}
