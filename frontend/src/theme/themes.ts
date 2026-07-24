export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  inputBackground: string;
  ring: string;
  /** Color used for the recharts bar fill (can't use CSS vars in SVG fill attr) */
  chartBar: string;
}

export interface AppTheme {
  id: string;
  label: string;
  desc: string;
  tokens: ThemeTokens;
  /** Colors used only for the mini preview card in Settings */
  preview: {
    bg: string;
    card: string;
    text: string;
    accent: string;
    border: string;
  };
}

export const THEMES: AppTheme[] = [
  {
    id: "light",
    label: "Light Mode",
    desc: "Clean & bright",
    tokens: {
      background: "#F5F4F1",
      foreground: "#16161A",
      card: "#FFFFFF",
      cardForeground: "#16161A",
      popover: "#FFFFFF",
      popoverForeground: "#16161A",
      primary: "#1C3557",
      primaryForeground: "#FFFFFF",
      secondary: "#EDF0F7",
      secondaryForeground: "#1C3557",
      muted: "#EDECE9",
      mutedForeground: "#6B6A72",
      accent: "#3F5FE0",
      accentForeground: "#FFFFFF",
      destructive: "#d4183d",
      border: "rgba(0,0,0,0.07)",
      inputBackground: "#EFEEEB",
      ring: "#3F5FE0",
      chartBar: "#D4DAFB",
    },
    preview: {
      bg: "#F5F4F1",
      card: "#FFFFFF",
      text: "#16161A",
      accent: "#3F5FE0",
      border: "rgba(0,0,0,0.08)",
    },
  },
  {
    id: "dark",
    label: "Dark Mode",
    desc: "Easy on the eyes",
    tokens: {
      background: "#131318",
      foreground: "#E2E1EC",
      card: "#1C1C26",
      cardForeground: "#E2E1EC",
      popover: "#1C1C26",
      popoverForeground: "#E2E1EC",
      primary: "#2C2C40",
      primaryForeground: "#E2E1EC",
      secondary: "#252535",
      secondaryForeground: "#C0BFCF",
      muted: "#222230",
      mutedForeground: "#888899",
      accent: "#7B9FFF",
      accentForeground: "#FFFFFF",
      destructive: "#F87171",
      border: "rgba(255,255,255,0.08)",
      inputBackground: "#222230",
      ring: "#7B9FFF",
      chartBar: "#3A4480",
    },
    preview: {
      bg: "#131318",
      card: "#1C1C26",
      text: "#E2E1EC",
      accent: "#7B9FFF",
      border: "rgba(255,255,255,0.08)",
    },
  },
  {
    id: "warm",
    label: "Warm Home",
    desc: "Cozy & inviting",
    tokens: {
      background: "#FBF7F0",
      foreground: "#2C2318",
      card: "#FFFBF5",
      cardForeground: "#2C2318",
      popover: "#FFFBF5",
      popoverForeground: "#2C2318",
      primary: "#6B3F1E",
      primaryForeground: "#FFFBF5",
      secondary: "#F5EBE0",
      secondaryForeground: "#6B3F1E",
      muted: "#F0E8DC",
      mutedForeground: "#8B6E52",
      accent: "#C2783F",
      accentForeground: "#FFFFFF",
      destructive: "#C0392B",
      border: "rgba(139,90,43,0.13)",
      inputBackground: "#EDE3D6",
      ring: "#C2783F",
      chartBar: "#EDCFB0",
    },
    preview: {
      bg: "#FBF7F0",
      card: "#FFFBF5",
      text: "#2C2318",
      accent: "#C2783F",
      border: "rgba(139,90,43,0.13)",
    },
  },
  {
    id: "gray",
    label: "Minimal Gray",
    desc: "Sharp & focused",
    tokens: {
      background: "#F1F1F1",
      foreground: "#111111",
      card: "#F9F9F9",
      cardForeground: "#111111",
      popover: "#F9F9F9",
      popoverForeground: "#111111",
      primary: "#1F1F1F",
      primaryForeground: "#FFFFFF",
      secondary: "#E8E8E8",
      secondaryForeground: "#333333",
      muted: "#E4E4E4",
      mutedForeground: "#666666",
      accent: "#3D3D3D",
      accentForeground: "#FFFFFF",
      destructive: "#CC2200",
      border: "rgba(0,0,0,0.10)",
      inputBackground: "#EAEAEA",
      ring: "#3D3D3D",
      chartBar: "#C0C0C0",
    },
    preview: {
      bg: "#F1F1F1",
      card: "#F9F9F9",
      text: "#111111",
      accent: "#3D3D3D",
      border: "rgba(0,0,0,0.10)",
    },
  },
  {
    id: "forest",
    label: "Forest",
    desc: "Grounded & calm",
    tokens: {
      background: "#EFF4EE",
      foreground: "#192E1B",
      card: "#F8FCF7",
      cardForeground: "#192E1B",
      popover: "#F8FCF7",
      popoverForeground: "#192E1B",
      primary: "#2D5218",
      primaryForeground: "#F8FCF7",
      secondary: "#E4EEE2",
      secondaryForeground: "#2D5218",
      muted: "#DDE9DB",
      mutedForeground: "#557055",
      accent: "#4A7C59",
      accentForeground: "#FFFFFF",
      destructive: "#B03030",
      border: "rgba(40,90,50,0.11)",
      inputBackground: "#DDE9DB",
      ring: "#4A7C59",
      chartBar: "#A8CEAF",
    },
    preview: {
      bg: "#EFF4EE",
      card: "#F8FCF7",
      text: "#192E1B",
      accent: "#4A7C59",
      border: "rgba(40,90,50,0.11)",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    desc: "Calm & refreshing",
    tokens: {
      background: "#EEF4FB",
      foreground: "#152030",
      card: "#F5FAFF",
      cardForeground: "#152030",
      popover: "#F5FAFF",
      popoverForeground: "#152030",
      primary: "#183D5D",
      primaryForeground: "#F5FAFF",
      secondary: "#DAEAF7",
      secondaryForeground: "#183D5D",
      muted: "#D5E7F5",
      mutedForeground: "#486882",
      accent: "#2E70AA",
      accentForeground: "#FFFFFF",
      destructive: "#C0392B",
      border: "rgba(25,80,140,0.10)",
      inputBackground: "#D5E7F5",
      ring: "#2E70AA",
      chartBar: "#A8CCEB",
    },
    preview: {
      bg: "#EEF4FB",
      card: "#F5FAFF",
      text: "#152030",
      accent: "#2E70AA",
      border: "rgba(25,80,140,0.10)",
    },
  },
];

export const DEFAULT_THEME_ID = "light";
