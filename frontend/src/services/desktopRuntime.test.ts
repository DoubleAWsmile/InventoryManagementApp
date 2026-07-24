import { afterEach, describe, expect, it, vi } from "vitest";
import { startupError } from "./desktopRuntime";
import { detectTauriRuntime } from "../config/runtime";

afterEach(() => vi.unstubAllGlobals());

describe("desktop runtime startup", () => {
  it("detects a normal browser without loading Tauri APIs", () => {
    vi.stubGlobal("window", {});
    expect(detectTauriRuntime()).toBe(false);
  });

  it("detects the Tauri runtime marker", () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    expect(detectTauriRuntime()).toBe(true);
  });

  it("turns startup failures into a recoverable error state", () => {
    expect(startupError(new Error("sidecar unavailable"))).toEqual({
      status: "error",
      message: "sidecar unavailable",
    });
  });
});
