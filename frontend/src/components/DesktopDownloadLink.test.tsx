import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { resolveAppRuntime } from "../config/runtime";
import DesktopDownloadLink from "./DesktopDownloadLink";

describe("desktop download navigation", () => {
  it("appears in web mode", () => {
    const html = renderToStaticMarkup(
      createElement(DesktopDownloadLink, {
        runtime: resolveAppRuntime("web", false),
      }),
    );
    expect(html).toContain('href="/download"');
  });

  it("does not appear in desktop mode", () => {
    const html = renderToStaticMarkup(
      createElement(DesktopDownloadLink, {
        runtime: resolveAppRuntime("desktop", true),
      }),
    );
    expect(html).toBe("");
  });
});
