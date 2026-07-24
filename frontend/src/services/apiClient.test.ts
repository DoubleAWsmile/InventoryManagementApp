import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, configureApiClient, configureHostedApiClient, LOCAL_API_FAILURE_EVENT } from "./apiClient";

afterEach(() => {
  vi.unstubAllGlobals();
  configureHostedApiClient();
});

describe("apiFetch runtime selection", () => {
  it("uses hosted mode without a bearer header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    configureHostedApiClient();

    await apiFetch("/api/health");

    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/health");
    expect(new Headers(request.headers).has("Authorization")).toBe(false);
  });

  it("uses desktop mode and inserts its in-memory bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    configureApiClient({ baseUrl: "http://127.0.0.1:59355/", token: "launch-token" });

    await apiFetch("/api/items");

    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:59355/api/items");
    expect(new Headers(request.headers).get("Authorization")).toBe("Bearer launch-token");
  });

  it("surfaces a desktop-local network failure", async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });
    vi.stubGlobal(
      "CustomEvent",
      class CustomEvent {
        constructor(readonly type: string) {}
      },
    );
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));
    configureApiClient({ baseUrl: "http://127.0.0.1:59355", token: "launch-token" });

    await expect(apiFetch("/api/items")).rejects.toMatchObject({ status: 0 });
    expect(dispatchEvent.mock.calls[0][0].type).toBe(LOCAL_API_FAILURE_EVENT);
  });
});
