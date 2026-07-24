import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DownloadPage from "./DownloadPage";

describe("DownloadPage", () => {
  it("shows a coming-soon state when no installer URLs are configured", () => {
    const html = renderToStaticMarkup(createElement(DownloadPage));
    expect(html).toContain("Desktop downloads are coming soon");
    expect(html).not.toContain("Download for Windows");
  });
});
