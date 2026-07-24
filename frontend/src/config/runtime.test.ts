import { describe, expect, it } from "vitest";
import { detectTauriRuntime, resolveAppRuntime } from "./runtime";

describe("app runtime", () => {
  it("defaults normal browser development to web", () => {
    expect(resolveAppRuntime(undefined, false)).toMatchObject({
      appTarget: "web",
      isWebApp: true,
      isDesktopApp: false,
    });
  });

  it("works without window and rejects unexpected targets", () => {
    expect(detectTauriRuntime(undefined)).toBe(false);
    expect(() => resolveAppRuntime("mobile", false)).toThrow("Unsupported VITE_APP_TARGET");
  });

  it("uses Tauri detection as a safety override for a misconfigured web build", () => {
    expect(resolveAppRuntime("web", true)).toMatchObject({
      appTarget: "web",
      isWebApp: false,
      isDesktopApp: true,
    });
  });
});
