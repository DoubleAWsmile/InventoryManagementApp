import { describe, expect, it } from "vitest";
import { resolveAppRuntime } from "../config/runtime";
import { downloadRouteAction, isDownloadRoute } from "./webRoutes";

describe("web-only routes", () => {
  it("registers /download for the web target", () => {
    expect(isDownloadRoute("/download", resolveAppRuntime("web", false))).toBe(true);
  });

  it("does not register /download for desktop or a Tauri safety override", () => {
    expect(isDownloadRoute("/download", resolveAppRuntime("desktop", true))).toBe(false);
    expect(isDownloadRoute("/download", resolveAppRuntime("web", true))).toBe(false);
    expect(downloadRouteAction("/download", resolveAppRuntime("desktop", true))).toBe("redirect");
  });
});
