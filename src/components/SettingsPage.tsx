import { useState, useRef } from "react";
import {
  Palette, User, Package, Bell, Shield, Tag, Zap, Settings,
  ChevronRight, Check, Plus, Trash2, Download, LogOut,
  Lock, Mail, AlertTriangle,
  Grid, List, Camera,
  FileText, Archive, Wifi, Layers, RefreshCw,
} from "lucide-react";
import { TopNav, NavStrip } from "./TopNav";
import type { PageName } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { useInventoryPrefs } from "../context/InventoryPrefsContext";

/* ── Sidebar section definitions ─────────────────────────────────── */

type SectionId =
  | "appearance"
  | "account"
  | "inventory"
  | "notifications"
  | "privacy"
  | "tags"
  | "integrations"
  | "advanced";

interface SidebarSection {
  id: SectionId;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  { id: "appearance", label: "Appearance", Icon: Palette },
  { id: "account", label: "Account", Icon: User },
  { id: "inventory", label: "Inventory Preferences", Icon: Package },
  { id: "notifications", label: "Notifications", Icon: Bell, badge: "3" },
  { id: "privacy", label: "Privacy & Data", Icon: Shield },
  { id: "tags", label: "Tags & Categories", Icon: Tag },
  { id: "integrations", label: "Integrations", Icon: Zap },
  { id: "advanced", label: "Advanced", Icon: Settings },
];

/* ── Theme definitions ───────────────────────────────────────────── */

/* ── Shared primitives ───────────────────────────────────────────── */

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className={[
        "relative flex-shrink-0 w-10 h-5.5 rounded-full border-2 transition-all duration-200",
        on ? "bg-accent border-accent" : "bg-muted border-border",
      ].join(" ")}
      style={{ width: "40px", height: "22px" }}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform duration-200",
          on ? "translate-x-[18px]" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>}
      </div>
      <div className="flex-shrink-0 flex items-center">{children}</div>
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[18px] font-bold text-foreground" style={{ letterSpacing: "-0.025em" }}>{title}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={["bg-card rounded-2xl border border-border shadow-sm", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

function CardSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && (
        <div className="px-5 pt-5 pb-0">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest" style={{ letterSpacing: "0.08em" }}>{title}</p>
        </div>
      )}
      <div className="px-5 pb-1">{children}</div>
    </div>
  );
}

/* ── Section: Appearance ─────────────────────────────────────────── */

function AppearanceSection() {
  const {
    savedThemeId, themes,
    setThemeById, useSystemTheme, setUseSystemTheme,
    tokens,
    fontSize, setFontSize,
    accentColor, setAccentColor,
  } = useTheme();

  const [reduceMotion, setReduceMotion] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const currentAccent = accentColor ?? tokens.accent;

  // Theme defaults + a few extras
  const ACCENT_SWATCHES = [
    { color: "#3F5FE0", label: "Indigo" },      // light theme
    { color: "#7B9FFF", label: "Periwinkle" },  // dark theme
    { color: "#2E70AA", label: "Ocean" },        // ocean theme
    { color: "#4A7C59", label: "Forest" },       // forest theme
    { color: "#C2783F", label: "Amber" },        // warm theme
    { color: "#3D3D3D", label: "Charcoal" },    // gray theme
    { color: "#A855F7", label: "Violet" },
    { color: "#EC4899", label: "Pink" },
    { color: "#111111", label: "Black" },
  ];

  const matchedSwatch = ACCENT_SWATCHES.find(s => s.color.toLowerCase() === currentAccent.toLowerCase());
  const accentLabel = matchedSwatch?.label ?? (accentColor ? "Custom" : "Theme default");

  return (
    <div className="space-y-5">
      <SectionHeader title="Appearance" desc="Control how HomeVault looks and feels across your experience." />

      {/* Theme selector */}
      <Card>
        <CardSection title="Theme">
          <div className="py-4">
            {useSystemTheme && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/8 border border-accent/15 text-xs text-muted-foreground">
                <span className="text-accent font-semibold">System theme active.</span>
                Manual selection is disabled while "Use system theme" is on.
              </div>
            )}
            <div className={["grid grid-cols-3 gap-3", useSystemTheme ? "opacity-50 pointer-events-none select-none" : ""].join(" ")}>
              {themes.map((t) => {
                const isSelected = !useSystemTheme && savedThemeId === t.id;
                const p = t.preview;
                return (
                  <button
                    key={t.id}
                    onClick={() => setThemeById(t.id)}
                    className={[
                      "relative rounded-xl border-2 overflow-hidden text-left transition-all duration-150 hover:shadow-md",
                      isSelected
                        ? "border-accent shadow-md ring-2 ring-accent/20"
                        : "border-border hover:border-accent/40",
                    ].join(" ")}
                  >
                    {/* Mini preview */}
                    <div className="h-[88px] p-2.5" style={{ background: p.bg }}>
                      <div
                        className="h-3.5 rounded-md mb-2 flex items-center px-2 gap-1.5"
                        style={{ background: p.card, border: `1px solid ${p.border}` }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.accent }} />
                        <div className="flex-1 h-1 rounded-full" style={{ background: p.border }} />
                        <div className="w-3 h-1 rounded-full" style={{ background: p.accent, opacity: 0.7 }} />
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="flex-1 h-10 rounded-lg p-1.5"
                            style={{ background: p.card, border: `1px solid ${p.border}` }}
                          >
                            <div className="w-3 h-1.5 rounded-full mb-1" style={{ background: p.accent, opacity: n === 1 ? 0.9 : 0.35 }} />
                            <div className="w-full h-1 rounded-full" style={{ background: p.text, opacity: 0.1 }} />
                            <div className="w-3/4 h-1 rounded-full mt-0.5" style={{ background: p.text, opacity: 0.07 }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Label row */}
                    <div className="px-3 py-2 border-t" style={{ borderColor: p.border, background: p.card }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold leading-tight" style={{ color: p.text }}>{t.label}</p>
                          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: p.text, opacity: 0.5 }}>{t.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: p.accent }}>
                            <Check size={10} color="#fff" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardSection>

        <div className="border-t border-border/50 mx-5" />

        <CardSection title="Accent Color">
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_SWATCHES.map((swatch) => {
                const isSelected = currentAccent.toLowerCase() === swatch.color.toLowerCase();
                return (
                  <button
                    key={swatch.label}
                    onClick={() => setAccentColor(swatch.color)}
                    title={swatch.label}
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-150 hover:scale-105"
                    style={{
                      background: swatch.color,
                      boxShadow: isSelected ? `0 0 0 3px var(--card), 0 0 0 5px ${swatch.color}` : undefined,
                      transform: isSelected ? "scale(1.12)" : undefined,
                    }}
                  >
                    {isSelected && <Check size={13} color={swatch.color === "#111111" || swatch.color === "#3D3D3D" ? "#aaa" : "#fff"} style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.35))" }} />}
                  </button>
                );
              })}

              {/* Custom color wheel */}
              <div className="relative">
                <button
                  onClick={() => colorInputRef.current?.click()}
                  title="Custom color"
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-150 hover:scale-105 border-2 border-white/60 shadow-sm overflow-hidden"
                  style={{
                    background: "conic-gradient(from 0deg, #EF4444, #F59E0B, #10B981, #3F5FE0, #A855F7, #EC4899, #EF4444)",
                    boxShadow: accentColor && !matchedSwatch ? `0 0 0 3px var(--card), 0 0 0 5px ${accentColor}` : undefined,
                    transform: accentColor && !matchedSwatch ? "scale(1.12)" : undefined,
                  }}
                >
                  {accentColor && !matchedSwatch
                    ? <Check size={13} color="#fff" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />
                    : <Plus size={12} color="#fff" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />
                  }
                </button>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={accentColor ?? tokens.accent}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                  style={{ position: "absolute", left: 0, top: 0 }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Active: <span className="font-semibold text-foreground">{accentLabel}</span>
              {accentColor && !matchedSwatch && (
                <span className="ml-1.5 font-mono text-[11px] text-muted-foreground/70">{accentColor}</span>
              )}
            </p>
          </div>
        </CardSection>

        <div className="border-t border-border/50 mx-5" />

        <CardSection title="System & Motion">
          <SettingRow
            label="Use system theme"
            desc="Automatically switch between light and dark based on your OS preference"
          >
            <Toggle on={useSystemTheme} onToggle={() => setUseSystemTheme(!useSystemTheme)} />
          </SettingRow>
          <SettingRow
            label="Reduce motion"
            desc="Minimize animations and transitions throughout the app"
          >
            <Toggle on={reduceMotion} onToggle={() => setReduceMotion((v) => !v)} />
          </SettingRow>
        </CardSection>

        <div className="border-t border-border/50 mx-5" />

        <CardSection title="Text">
          <SettingRow label="Font size" desc="Base text size across the interface">
            <div className="flex items-center h-8 rounded-lg border border-border bg-muted/50 p-0.5 gap-0.5">
              {(["small", "default", "large"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={[
                    "h-7 px-3 rounded-md text-xs font-semibold capitalize transition-all",
                    fontSize === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
          </SettingRow>
        </CardSection>
      </Card>
    </div>
  );
}

/* ── Section: Account ────────────────────────────────────────────── */

function AccountSection() {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="space-y-5">
      <SectionHeader title="Account" desc="Manage your profile, credentials, and account settings." />

      {/* Profile card */}
      <Card>
        <CardSection title="Profile">
          <div className="py-4">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0 group">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-accent/30 transition-all">
                  <span className="text-lg font-bold text-primary-foreground">SR</span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center shadow-md hover:bg-accent/90 transition-colors">
                  <Camera size={11} />
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
                    <input
                      defaultValue="Sarah"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
                    <input
                      defaultValue="Reynolds"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      defaultValue="sarah.reynolds@gmail.com"
                      type="email"
                      className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <button className="h-8 px-4 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardSection>
      </Card>

      {/* Security */}
      <Card>
        <CardSection title="Security">
          <SettingRow label="Password" desc="Last changed 3 months ago">
            <button
              onClick={() => setShowChangePassword((v) => !v)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Lock size={11} />Change Password
            </button>
          </SettingRow>
          {showChangePassword && (
            <div className="pb-4 space-y-2.5">
              {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                  <input
                    type="password"
                    placeholder="••••••••••"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button className="h-8 px-4 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors">
                  Update Password
                </button>
                <button onClick={() => setShowChangePassword(false)} className="h-8 px-3.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
          <SettingRow label="Two-Factor Authentication" desc="Not yet enabled — add an extra layer of security">
            <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors">
              Set Up 2FA
            </button>
          </SettingRow>
        </CardSection>
      </Card>

      {/* Session */}
      <Card className="border-red-200/60">
        <CardSection title="Session">
          <SettingRow label="Sign Out" desc="Sign out of HomeVault on this device">
            <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
              <LogOut size={11} />Sign Out
            </button>
          </SettingRow>
        </CardSection>
      </Card>
    </div>
  );
}

/* ── Section: Inventory Preferences ─────────────────────────────── */

function InventorySection() {
  const {
    defaultView, setDefaultView,
    defaultSort, setDefaultSort,
    currency, setCurrency,
    showValues, setShowValues,
    showLowStock, setShowLowStock,
    showMissingInfo, setShowMissingInfo,
  } = useInventoryPrefs();

  const SELECT_STYLE = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6A72' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center",
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Inventory Preferences" desc="Configure how your inventory is displayed and managed." />

      <Card>
        <CardSection title="Display">
          <SettingRow label="Default inventory view" desc="How items appear when you open the inventory">
            <div className="flex items-center h-8 rounded-lg border border-border bg-muted/50 p-0.5 gap-0.5">
              <button
                onClick={() => setDefaultView("grid")}
                className={["h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all", defaultView === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}
              >
                <Grid size={11} />Grid
              </button>
              <button
                onClick={() => setDefaultView("list")}
                className={["h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all", defaultView === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}
              >
                <List size={11} />List
              </button>
            </div>
          </SettingRow>
          <SettingRow label="Default sort order" desc="How items are sorted when you first open inventory">
            <select
              value={defaultSort}
              onChange={(e) => setDefaultSort(e.target.value as typeof defaultSort)}
              className="h-9 pl-3 pr-8 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all appearance-none"
              style={SELECT_STYLE}
            >
              <option value="addedDate">Recently Added</option>
              <option value="name">Item Name</option>
              <option value="category">Category</option>
              <option value="room">Room</option>
              <option value="value">Estimated Value</option>
              <option value="qty">Quantity</option>
            </select>
          </SettingRow>
          <SettingRow label="Default currency" desc="Currency symbol shown on item cards and summaries">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as typeof currency)}
              className="h-9 pl-3 pr-8 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all appearance-none"
              style={SELECT_STYLE}
            >
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
              <option value="CAD">CAD — Canadian Dollar (CA$)</option>
              <option value="AUD">AUD — Australian Dollar (A$)</option>
            </select>
          </SettingRow>
        </CardSection>

        <div className="border-t border-border/50 mx-5" />

        <CardSection title="Item Cards">
          <SettingRow label="Show estimated value" desc="Display the estimated value on every item card">
            <Toggle on={showValues} onToggle={() => setShowValues(!showValues)} />
          </SettingRow>
          <SettingRow label="Show low-stock warnings" desc="Highlight items that are running low">
            <Toggle on={showLowStock} onToggle={() => setShowLowStock(!showLowStock)} />
          </SettingRow>
          <SettingRow label="Show missing-info warnings" desc="Flag items with incomplete information">
            <Toggle on={showMissingInfo} onToggle={() => setShowMissingInfo(!showMissingInfo)} />
          </SettingRow>
        </CardSection>
      </Card>
    </div>
  );
}

/* ── Section: Notifications ──────────────────────────────────────── */

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    lowStock: true,
    warrantyExpiry: true,
    missingInfo: false,
    monthlySummary: true,
    newFeatures: false,
    securityAlerts: true,
  });
  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" desc="Choose what HomeVault sends you reminders about." />

      <Card>
        <CardSection title="Inventory Alerts">
          <SettingRow label="Low-stock reminders" desc="Get notified when items fall below their minimum quantity">
            <Toggle on={prefs.lowStock} onToggle={() => toggle("lowStock")} />
          </SettingRow>
          <SettingRow label="Warranty expiration reminders" desc="Be alerted 30 days before a warranty expires">
            <Toggle on={prefs.warrantyExpiry} onToggle={() => toggle("warrantyExpiry")} />
          </SettingRow>
          <SettingRow label="Missing item information" desc="Get reminded to complete items that are missing details">
            <Toggle on={prefs.missingInfo} onToggle={() => toggle("missingInfo")} />
          </SettingRow>
        </CardSection>

        <div className="border-t border-border/50 mx-5" />

        <CardSection title="Reports & Updates">
          <SettingRow label="Monthly inventory summary" desc="A brief digest of your inventory changes each month">
            <Toggle on={prefs.monthlySummary} onToggle={() => toggle("monthlySummary")} />
          </SettingRow>
          <SettingRow label="New features & tips" desc="Occasional emails about HomeVault updates">
            <Toggle on={prefs.newFeatures} onToggle={() => toggle("newFeatures")} />
          </SettingRow>
          <SettingRow label="Security alerts" desc="Important notices about your account security">
            <Toggle on={prefs.securityAlerts} onToggle={() => toggle("securityAlerts")} />
          </SettingRow>
        </CardSection>
      </Card>

      {/* Active count summary */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-accent/8 border border-accent/15">
        <Bell size={14} className="text-accent flex-shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">{Object.values(prefs).filter(Boolean).length}</span> notification types active.
          <button className="text-accent font-semibold ml-1.5 hover:underline">Manage delivery channels</button>
        </p>
      </div>
    </div>
  );
}

/* ── Section: Privacy & Data ─────────────────────────────────────── */

function PrivacySection() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-5">
      <SectionHeader title="Privacy & Data" desc="Control your data, export records, and manage your account." />

      <Card>
        <CardSection title="Your Data">
          <SettingRow label="Export inventory data" desc="Download a full CSV or JSON export of your inventory">
            <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors">
              <Download size={11} />Export CSV
            </button>
          </SettingRow>
          <SettingRow label="Download receipts & images" desc="Get a ZIP archive of all uploaded documents and photos">
            <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors">
              <Archive size={11} />Download ZIP
            </button>
          </SettingRow>
          <SettingRow label="Clear local cache" desc="Remove cached data from your browser — your inventory is safe">
            <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors">
              <RefreshCw size={11} />Clear Cache
            </button>
          </SettingRow>
        </CardSection>
      </Card>

      <Card className="border-red-200/70">
        <CardSection title="Danger Zone">
          <SettingRow
            label="Delete Account"
            desc="Permanently delete your HomeVault account and all data. This action cannot be undone."
          >
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={11} />Delete Account
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle size={12} className="text-red-500" />
                <span className="text-xs font-semibold text-red-600">Are you sure?</span>
                <button className="text-xs font-bold text-red-700 hover:text-red-900 px-1 hover:underline">Yes, delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground px-1">Cancel</button>
              </div>
            )}
          </SettingRow>
        </CardSection>
      </Card>
    </div>
  );
}

/* ── Section: Tags & Categories ──────────────────────────────────── */

const TAG_COLORS_PALETTE = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700", "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700",
];

const INITIAL_TAGS = ["Electronics", "Tools", "Clothing", "Documents", "Warranty", "Frequently Used", "Outdoor", "Kitchen"];
const INITIAL_CATEGORIES = [
  { name: "Electronics", count: 42, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Tools", count: 18, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Clothing", count: 31, color: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "Appliances", count: 14, color: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "Fitness", count: 9, color: "bg-teal-50 text-teal-700 border-teal-200" },
  { name: "Safety", count: 7, color: "bg-red-50 text-red-700 border-red-200" },
];

function TagsSection() {
  const [tags, setTags] = useState(INITIAL_TAGS);
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((v) => [...v, t]);
    setTagInput("");
    setAddingTag(false);
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Tags & Categories" desc="Manage the tags and categories used across your inventory." />

      <Card>
        <CardSection title="Tags">
          <div className="py-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, i) => (
                <div
                  key={tag}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${TAG_COLORS_PALETTE[i % TAG_COLORS_PALETTE.length]}`}
                >
                  {tag}
                  <button
                    onClick={() => setTags((v) => v.filter((t) => t !== tag))}
                    className="opacity-40 hover:opacity-100 transition-opacity"
                  >
                    <span className="text-[10px] font-bold leading-none">×</span>
                  </button>
                </div>
              ))}

              {addingTag ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTag();
                      if (e.key === "Escape") { setAddingTag(false); setTagInput(""); }
                    }}
                    placeholder="New tag…"
                    className="h-8 w-28 px-2.5 rounded-full border border-accent/50 bg-accent/5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                  <button onClick={addTag} className="h-8 w-8 rounded-full bg-accent text-white text-xs flex items-center justify-center hover:bg-accent/90 transition-colors">
                    <Check size={11} />
                  </button>
                  <button onClick={() => { setAddingTag(false); setTagInput(""); }} className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors text-sm">
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTag(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all"
                >
                  <Plus size={11} />Add Tag
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{tags.length} tags total. Tags are used across all items for quick filtering and search.</p>
          </div>
        </CardSection>

        <div className="border-t border-border/50 mx-5" />

        <CardSection title="Categories">
          <div className="py-3 space-y-2">
            {INITIAL_CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cat.color}`}>
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{cat.count} items</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border">
                    Rename
                  </button>
                  <button className="h-7 px-2.5 rounded-md text-xs font-medium text-red-500/70 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                <Plus size={11} />Add Category
              </button>
            </div>
          </div>
        </CardSection>
      </Card>
    </div>
  );
}

/* ── Section: Integrations ───────────────────────────────────────── */

const INTEGRATIONS = [
  { name: "Google Drive", desc: "Sync receipts and photos to your Drive", Icon: Archive, connected: true, color: "bg-blue-50 text-blue-600" },
  { name: "Dropbox", desc: "Automatically back up inventory exports", Icon: Download, connected: false, color: "bg-blue-50 text-blue-600" },
  { name: "Google Sheets", desc: "Live-sync your inventory to a spreadsheet", Icon: FileText, connected: false, color: "bg-green-50 text-green-600" },
  { name: "IFTTT", desc: "Build automations triggered by inventory events", Icon: Zap, connected: false, color: "bg-orange-50 text-orange-600" },
  { name: "HomeKit / Smart Home", desc: "Connect with smart home location tracking", Icon: Wifi, connected: false, color: "bg-purple-50 text-purple-600" },
];

function IntegrationsSection() {
  const [connected, setConnected] = useState<Set<string>>(new Set(["Google Drive"]));

  return (
    <div className="space-y-5">
      <SectionHeader title="Integrations" desc="Connect HomeVault to the tools and services you already use." />

      <Card>
        <div className="divide-y divide-border/50">
          {INTEGRATIONS.map((intg) => {
            const isConnected = connected.has(intg.name);
            return (
              <div key={intg.name} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${intg.color}`}>
                  <intg.Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{intg.name}</p>
                    {isConnected && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{intg.desc}</p>
                </div>
                <button
                  onClick={() => setConnected((prev) => {
                    const next = new Set(prev);
                    if (next.has(intg.name)) next.delete(intg.name);
                    else next.add(intg.name);
                    return next;
                  })}
                  className={[
                    "flex-shrink-0 h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors",
                    isConnected
                      ? "border border-border bg-card text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                      : "bg-accent text-accent-foreground hover:bg-accent/90",
                  ].join(" ")}
                >
                  {isConnected ? "Disconnect" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ── Section: Advanced ───────────────────────────────────────────── */

function AdvancedSection() {
  const [autoSave, setAutoSave] = useState(true);
  const [telemetry, setTelemetry] = useState(false);
  const [devMode, setDevMode] = useState(false);

  return (
    <div className="space-y-5">
      <SectionHeader title="Advanced" desc="Developer options, performance controls, and experimental features." />

      <Card>
        <CardSection title="Behavior">
          <SettingRow label="Auto-save changes" desc="Automatically save edits without requiring you to click Save">
            <Toggle on={autoSave} onToggle={() => setAutoSave((v) => !v)} />
          </SettingRow>
          <SettingRow label="Usage analytics" desc="Share anonymous usage data to help improve HomeVault">
            <Toggle on={telemetry} onToggle={() => setTelemetry((v) => !v)} />
          </SettingRow>
          <SettingRow label="Developer mode" desc="Show additional debug information and experimental controls">
            <Toggle on={devMode} onToggle={() => setDevMode((v) => !v)} />
          </SettingRow>
        </CardSection>

        <div className="border-t border-border/50 mx-5" />

        <CardSection title="Application">
          <SettingRow label="App version" desc="You're running the latest version">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">v2.4.1</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Up to date</span>
            </div>
          </SettingRow>
          <SettingRow label="Reset app preferences" desc="Restore all settings to their original defaults">
            <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <RefreshCw size={11} />Reset to Defaults
            </button>
          </SettingRow>
        </CardSection>
      </Card>

      {devMode && (
        <div className="p-4 rounded-xl bg-foreground/5 border border-border font-mono text-xs text-muted-foreground space-y-1">
          <p className="font-bold text-foreground mb-2">Debug Info</p>
          <p>Build: production · React 18.3.1</p>
          <p>Cache: 48 items · 2.1 MB</p>
          <p>Session: 2h 14m · Idle: 3m 22s</p>
          <p>User ID: usr_8a72c3d1</p>
        </div>
      )}
    </div>
  );
}

/* ── Main Settings Page ──────────────────────────────────────────── */

export interface SettingsPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
}

export default function SettingsPage({ onSignOut, onNavigate }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("appearance");

  const sectionContent: Record<SectionId, React.ReactNode> = {
    appearance: <AppearanceSection />,
    account: <AccountSection />,
    inventory: <InventorySection />,
    notifications: <NotificationsSection />,
    privacy: <PrivacySection />,
    tags: <TagsSection />,
    integrations: <IntegrationsSection />,
    advanced: <AdvancedSection />,
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <TopNav onSignOut={onSignOut} />

      <main className="max-w-[1440px] mx-auto px-8 py-7">
        <NavStrip
          active=""
          onSelect={(id) => {
            if (id === "inventory") onNavigate("allItems");
            else onNavigate("dashboard");
          }}
        />

        {/* Page header */}
        <div className="mt-6 mb-7">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
            <ChevronRight size={13} />
            <span className="text-foreground font-medium">Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Settings size={18} className="text-accent" />
            </div>
            <div>
              <h1
                className="text-[26px] font-bold text-foreground leading-tight"
                style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}
              >
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">Customize how HomeVault works for you.</p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-7 items-start">

          {/* ── Left sidebar ────────────────────────────────────── */}
          <div className="w-[220px] flex-shrink-0">
            <nav className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {SIDEBAR_SECTIONS.map((section, idx) => {
                const isActive = activeSection === section.id;
                const isLast = idx === SIDEBAR_SECTIONS.length - 1;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150",
                      !isLast ? "border-b border-border/50" : "",
                      isActive
                        ? "bg-accent/8 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    ].join(" ")}
                  >
                    <div className={["w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors", isActive ? "bg-accent/15" : "bg-muted"].join(" ")}>
                      <section.Icon size={13} className={isActive ? "text-accent" : ""} />
                    </div>
                    <span className={["text-sm font-semibold flex-1 text-left", isActive ? "text-foreground" : ""].join(" ")}>
                      {section.label}
                    </span>
                    {section.badge && (
                      <span className="text-[10px] font-bold w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0">
                        {section.badge}
                      </span>
                    )}
                    {isActive && <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />}
                  </button>
                );
              })}
            </nav>

            {/* App info */}
            <div className="mt-4 px-4 py-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Layers size={12} className="text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground">HomeVault</span>
              </div>
              <p className="text-[11px] text-muted-foreground/70">Version 2.4.1 · Free plan</p>
              <button className="mt-2 text-[11px] font-semibold text-accent hover:underline">Upgrade to Pro →</button>
            </div>
          </div>

          {/* ── Right panel ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 pb-12">
            {sectionContent[activeSection]}
          </div>
        </div>
      </main>

      <style>{`
        .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
