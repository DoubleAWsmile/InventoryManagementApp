import { describe, expect, it } from "vitest";
import { configuredDownloads } from "./downloads";

describe("desktop download configuration", () => {
  it("only includes platforms with configured URLs", () => {
    expect(
      configuredDownloads({
        VITE_DOWNLOAD_WINDOWS_URL: "https://downloads.example/windows",
        VITE_DOWNLOAD_MACOS_URL: " ",
      }),
    ).toEqual([
      {
        platform: "windows",
        label: "Windows",
        url: "https://downloads.example/windows",
        format: "NSIS installer",
        architecture: "x86_64",
        releaseStatus: "available",
      },
    ]);
  });

  it("returns no options for the coming-soon state", () => {
    expect(configuredDownloads({})).toEqual([]);
  });
});
