export type ApiRuntimeConfig = {
  baseUrl: string;
  token?: string;
};

const hostedBaseUrl = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080"
).replace(/\/$/, "");

let runtimeConfig: ApiRuntimeConfig = { baseUrl: hostedBaseUrl };

export function configureApiClient(config: ApiRuntimeConfig): void {
  const baseUrl = config.baseUrl.trim().replace(/\/$/, "");
  if (!/^https?:\/\//.test(baseUrl)) throw new Error("API base URL must use HTTP or HTTPS");
  runtimeConfig = { baseUrl, token: config.token };
}

export function configureHostedApiClient(): void {
  runtimeConfig = { baseUrl: hostedBaseUrl };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const UNAUTHORIZED_EVENT = "inventory:unauthorized";
export const LOCAL_API_FAILURE_EVENT = "inventory:local-api-failure";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  if (runtimeConfig.token) headers.set("Authorization", `Bearer ${runtimeConfig.token}`);

  let response: Response;
  try {
    response = await fetch(`${runtimeConfig.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (error) {
    if (runtimeConfig.token) {
      window.dispatchEvent(new CustomEvent(LOCAL_API_FAILURE_EVENT));
      throw new ApiError(
        "The local inventory service is unavailable. Restart the desktop application.",
        0,
        error,
      );
    }
    throw error;
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const body: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      typeof body === "string"
        ? body.trim()
        : body && typeof body === "object" && "message" in body && typeof body.message === "string"
          ? body.message
          : `Request failed with status ${response.status}`;
    const error = new ApiError(
      message || `Request failed with status ${response.status}`,
      response.status,
      body,
    );
    if (response.status === 401) window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    throw error;
  }

  return body as T;
}
