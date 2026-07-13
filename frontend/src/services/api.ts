export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiItem {
  id: string;
  userId: string;
  name: string;
  category: string;
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
  userId: string;
  name: string;
  category: string;
  roomLocation: string;
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = (await response.text()).trim();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function createUser(email: string, displayName: string) {
  return apiRequest<User>("/api/users", {
    method: "POST",
    body: JSON.stringify({ email, displayName }),
  });
}

export function demoLogin(email: string) {
  return apiRequest<User>("/api/auth/demo-login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getItems(userId: string) {
  return apiRequest<ApiItem[]>(`/api/items?userId=${encodeURIComponent(userId)}`);
}

export function getRecentItems(userId: string, limit = 6) {
  const params = new URLSearchParams({ userId, limit: String(limit) });
  return apiRequest<ApiItem[]>(`/api/items/recent?${params.toString()}`);
}

export function createItem(payload: CreateItemPayload) {
  return apiRequest<ApiItem>("/api/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
