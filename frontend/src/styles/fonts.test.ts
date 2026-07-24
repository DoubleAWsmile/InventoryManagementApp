import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const frontendRoot = resolve(import.meta.dirname, "../..");
const fontsCss = readFileSync(resolve(frontendRoot, "src/styles/fonts.css"), "utf8");
const themeCss = readFileSync(resolve(frontendRoot, "src/styles/theme.css"), "utf8");
const tauriConfig = JSON.parse(readFileSync(resolve(frontendRoot, "src-tauri/tauri.conf.json"), "utf8"));

describe("shared typography configuration", () => {
  it("applies one centralized UI stack to the application root and controls", () => {
    expect(fontsCss).toContain('--font-ui: "Figtree", "Segoe UI", Arial, sans-serif');
    expect(fontsCss).toMatch(/html,\s*body,\s*#root,\s*button,\s*input,\s*select,\s*textarea/);
    expect(fontsCss).toContain("font-family: var(--font-ui)");
    expect(themeCss).toContain("--font-sans: var(--font-ui)");
  });

  it("contains no remote Google Fonts dependency", () => {
    expect(fontsCss).not.toContain("fonts.googleapis.com");
    expect(fontsCss).not.toContain("fonts.gstatic.com");
    expect(tauriConfig.app.security.csp).not.toContain("fonts.googleapis.com");
    expect(tauriConfig.app.security.csp).not.toContain("fonts.gstatic.com");
  });

  it("resolves every locally bundled weight and style", () => {
    const stylesheets = [
      "@fontsource/figtree/400.css",
      "@fontsource/figtree/400-italic.css",
      "@fontsource/figtree/500.css",
      "@fontsource/figtree/600.css",
      "@fontsource/figtree/700.css",
      "@fontsource/instrument-serif/400.css",
    ];
    for (const stylesheet of stylesheets) {
      expect(() => require.resolve(stylesheet)).not.toThrow();
      expect(fontsCss).toContain(`@import "${stylesheet}"`);
    }
  });

  it("allows only bundled local fonts in the Tauri CSP", () => {
    expect(tauriConfig.app.security.csp).toContain("font-src 'self' asset: http://asset.localhost");
  });
});
