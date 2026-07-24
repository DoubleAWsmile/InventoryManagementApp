import { describe, expect, it } from "vitest";
import {
  parseReleaseTag,
  selectInstallerNames,
  stableArtifactNames,
  STABLE_WINDOWS_FILENAME,
  validateVersionConsistency,
  WINDOWS_TARGET,
} from "./release.mjs";

describe("desktop release planning", () => {
  it("parses stable and prerelease tags", () => {
    expect(parseReleaseTag("v1.2.3")).toMatchObject({ version: "1.2.3", prerelease: false });
    expect(parseReleaseTag("v1.2.3-rc.2")).toMatchObject({
      version: "1.2.3-rc.2",
      prerelease: true,
    });
    expect(() => parseReleaseTag("release-1.2.3")).toThrow("must use v<semver>");
  });

  it("keeps all configured application versions synchronized", () => {
    expect(validateVersionConsistency("v0.1.0")).toMatchObject({
      packageVersion: "0.1.0",
      tauriVersion: "0.1.0",
      cargoVersion: "0.1.0",
    });
    expect(() => validateVersionConsistency("v0.2.0")).toThrow("does not match");
  });

  it("generates clear versioned and stable Windows artifact names", () => {
    expect(WINDOWS_TARGET).toBe("x86_64-pc-windows-msvc");
    expect(stableArtifactNames("1.2.3")).toEqual({
      nsis: "InventoryManagementApp-1.2.3-windows-x86_64-setup.exe",
      msi: "InventoryManagementApp-1.2.3-windows-x86_64.msi",
      stableNsis: STABLE_WINDOWS_FILENAME,
    });
  });

  it("discovers exactly one installer of each requested type", () => {
    expect(selectInstallerNames(["notes.txt", "HomeVault.msi"], ".msi")).toEqual(["HomeVault.msi"]);
    expect(() => selectInstallerNames([], ".exe")).toThrow("found 0");
    expect(() => selectInstallerNames(["one.exe", "two.exe"], ".exe")).toThrow("found 2");
  });
});
