import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type InventoryView = "grid" | "list";
export type SortKey = "addedDate" | "name" | "category" | "room" | "value" | "qty";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
};

interface InventoryPrefs {
  defaultView: InventoryView;
  defaultSort: SortKey;
  currency: CurrencyCode;
  showValues: boolean;
  showLowStock: boolean;
  showMissingInfo: boolean;
}

interface InventoryPrefsContextValue extends InventoryPrefs {
  currencySymbol: string;
  setDefaultView: (v: InventoryView) => void;
  setDefaultSort: (s: SortKey) => void;
  setCurrency: (c: CurrencyCode) => void;
  setShowValues: (v: boolean) => void;
  setShowLowStock: (v: boolean) => void;
  setShowMissingInfo: (v: boolean) => void;
}

const CTX = createContext<InventoryPrefsContextValue | null>(null);

const KEY = "homevault-inv-prefs";

function load(): InventoryPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch {}
  return defaults();
}

function defaults(): InventoryPrefs {
  return {
    defaultView: "grid",
    defaultSort: "addedDate",
    currency: "USD",
    showValues: true,
    showLowStock: true,
    showMissingInfo: true,
  };
}

export function InventoryPrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<InventoryPrefs>(load);

  const update = useCallback((patch: Partial<InventoryPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<InventoryPrefsContextValue>(
    () => ({
      ...prefs,
      currencySymbol: CURRENCY_SYMBOLS[prefs.currency],
      setDefaultView: (v) => update({ defaultView: v }),
      setDefaultSort: (s) => update({ defaultSort: s }),
      setCurrency: (c) => update({ currency: c }),
      setShowValues: (v) => update({ showValues: v }),
      setShowLowStock: (v) => update({ showLowStock: v }),
      setShowMissingInfo: (v) => update({ showMissingInfo: v }),
    }),
    [prefs, update],
  );

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

export function useInventoryPrefs() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("useInventoryPrefs must be used within <InventoryPrefsProvider>");
  return ctx;
}
