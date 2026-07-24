import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { THEMES, DEFAULT_THEME_ID } from "./themes";
import type { AppTheme, ThemeTokens } from "./themes";

/* ── Storage keys ───────────────────────────────────────────────── */

const KEY_THEME = "homevault-theme";
const KEY_SYSTEM = "homevault-use-system";
const KEY_DENSITY = "homevault-density";
const KEY_FONT_SIZE = "homevault-font-size";
const KEY_ACCENT = "homevault-accent";

export type Density = "compact" | "comfortable" | "spacious";
export type FontSizeOption = number;

function getSavedFontSize(): FontSizeOption {
  const saved = localStorage.getItem(KEY_FONT_SIZE);
  const legacySizes: Record<string, number> = { small: 13, default: 16, large: 19 };
  if (!saved) return 16;
  if (saved in legacySizes) return legacySizes[saved];

  const parsed = Number(saved);
  return Number.isFinite(parsed) ? Math.min(21, Math.max(13, parsed)) : 16;
}

/* ── CSS variable injection ─────────────────────────────────────── */

function applyTokens(tokens: ThemeTokens) {
  const r = document.documentElement;
  r.style.setProperty("--background", tokens.background);
  r.style.setProperty("--foreground", tokens.foreground);
  r.style.setProperty("--card", tokens.card);
  r.style.setProperty("--card-foreground", tokens.cardForeground);
  r.style.setProperty("--popover", tokens.popover);
  r.style.setProperty("--popover-foreground", tokens.popoverForeground);
  r.style.setProperty("--primary", tokens.primary);
  r.style.setProperty("--primary-foreground", tokens.primaryForeground);
  r.style.setProperty("--secondary", tokens.secondary);
  r.style.setProperty("--secondary-foreground", tokens.secondaryForeground);
  r.style.setProperty("--muted", tokens.muted);
  r.style.setProperty("--muted-foreground", tokens.mutedForeground);
  r.style.setProperty("--accent", tokens.accent);
  r.style.setProperty("--accent-foreground", tokens.accentForeground);
  r.style.setProperty("--destructive", tokens.destructive);
  r.style.setProperty("--border", tokens.border);
  r.style.setProperty("--input-background", tokens.inputBackground);
  r.style.setProperty("--ring", tokens.ring);
}

/* ── System preference helper ───────────────────────────────────── */

function getSystemThemeId(): string {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function findTheme(id: string): AppTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/* ── Density/font-size CSS injection ────────────────────────────── */

const DENSITY_CSS = `
[data-density="compact"] main {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  padding-left: 20px !important;
  padding-right: 20px !important;
}
[data-density="compact"] main > * + * { margin-top: 12px !important; }
[data-density="spacious"] main {
  padding-top: 48px !important;
  padding-bottom: 48px !important;
  padding-left: 56px !important;
  padding-right: 56px !important;
}
[data-density="spacious"] main > * + * { margin-top: 36px !important; }
`;

/* ── Context shape ──────────────────────────────────────────────── */

interface ThemeContextValue {
  /** Effective theme id (may differ from savedThemeId when useSystemTheme is on) */
  themeId: string;
  /** Saved manual theme id (what the user explicitly picked) */
  savedThemeId: string;
  theme: AppTheme;
  tokens: ThemeTokens;
  themes: AppTheme[];
  setThemeById: (id: string) => void;
  useSystemTheme: boolean;
  setUseSystemTheme: (v: boolean) => void;
  density: Density;
  setDensity: (d: Density) => void;
  fontSize: FontSizeOption;
  setFontSize: (s: FontSizeOption) => void;
  accentColor: string | null;
  setAccentColor: (c: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────────────── */

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [savedThemeId, setSavedThemeId] = useState<string>(
    () => localStorage.getItem(KEY_THEME) ?? DEFAULT_THEME_ID,
  );
  const [useSystemTheme, setUseSystemThemeState] = useState<boolean>(
    () => localStorage.getItem(KEY_SYSTEM) === "true",
  );
  const [density, setDensityState] = useState<Density>(
    () => (localStorage.getItem(KEY_DENSITY) as Density) ?? "comfortable",
  );
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(
    getSavedFontSize,
  );
  const [accentColor, setAccentColorState] = useState<string | null>(() => localStorage.getItem(KEY_ACCENT));

  const effectiveThemeId = useSystemTheme ? getSystemThemeId() : savedThemeId;
  const theme = useMemo(() => findTheme(effectiveThemeId), [effectiveThemeId]);

  /* Inject density CSS once */
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "homevault-density-css";
    el.textContent = DENSITY_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  /* Apply tokens + accent override whenever theme or accent changes */
  useEffect(() => {
    applyTokens(theme.tokens);
    if (accentColor) {
      document.documentElement.style.setProperty("--accent", accentColor);
      document.documentElement.style.setProperty("--ring", accentColor);
    }
  }, [theme, accentColor]);

  /* Track OS preference changes when system theme is enabled */
  useEffect(() => {
    if (!useSystemTheme) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTokens(findTheme(getSystemThemeId()).tokens);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [useSystemTheme]);

  /* Apply density attribute */
  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  /* Apply font size to html element */
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const setThemeById = useCallback((id: string) => {
    setSavedThemeId(id);
    localStorage.setItem(KEY_THEME, id);
    // Clear accent override so theme's natural accent applies
    setAccentColorState(null);
    localStorage.removeItem(KEY_ACCENT);
  }, []);

  const setUseSystemTheme = useCallback((v: boolean) => {
    setUseSystemThemeState(v);
    localStorage.setItem(KEY_SYSTEM, String(v));
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    localStorage.setItem(KEY_DENSITY, d);
  }, []);

  const setFontSize = useCallback((s: FontSizeOption) => {
    setFontSizeState(s);
    localStorage.setItem(KEY_FONT_SIZE, s);
  }, []);

  const setAccentColor = useCallback((c: string | null) => {
    setAccentColorState(c);
    if (c) localStorage.setItem(KEY_ACCENT, c);
    else localStorage.removeItem(KEY_ACCENT);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: effectiveThemeId,
      savedThemeId,
      theme,
      tokens: theme.tokens,
      themes: THEMES,
      setThemeById,
      useSystemTheme,
      setUseSystemTheme,
      density,
      setDensity,
      fontSize,
      setFontSize,
      accentColor,
      setAccentColor,
    }),
    [
      effectiveThemeId,
      savedThemeId,
      theme,
      setThemeById,
      useSystemTheme,
      setUseSystemTheme,
      density,
      setDensity,
      fontSize,
      setFontSize,
      accentColor,
      setAccentColor,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/* ── Hook ───────────────────────────────────────────────────────── */

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
