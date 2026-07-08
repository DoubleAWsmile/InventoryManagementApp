import { useState } from "react";
import {
  ChevronRight, Upload, Plus, X, Package, Tag,
  ChevronDown, CheckCircle2,
} from "lucide-react";
import { TopNav, NavStrip } from "../components/TopNav";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";

const CATEGORIES = ["Electronics", "Tools", "Clothing", "Documents", "Cables", "Safety", "Household Supplies", "Furniture"];
const ROOMS = ["Bedroom", "Office", "Garage", "Kitchen", "Living Room", "Closet", "Utility Room", "Hall Closet"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const SUGGESTED_TAGS = ["Warranty", "Expensive", "Frequently Used", "Travel", "Fragile", "Insured", "Gift", "Seasonal"];

interface FormState {
  name: string;
  category: string;
  room: string;
  qty: string;
  value: string;
  purchaseDate: string;
  condition: string;
  brand: string;
  model: string;
  serial: string;
  description: string;
  notes: string;
  tags: string[];
}

const EMPTY: FormState = {
  name: "", category: "", room: "", qty: "1", value: "",
  purchaseDate: "", condition: "", brand: "", model: "", serial: "",
  description: "", notes: "", tags: [],
};

export interface AddItemPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function AddItemPage({ onSignOut, onNavigate, onSettings }: AddItemPageProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState(false);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleTag = (tag: string) =>
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setForm(EMPTY);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID["addItem"] ?? "add"}
          onSelect={(id) => { const p = NAV_ID_TO_PAGE[id]; if (p) onNavigate(p); }}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Add New Item</span>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-foreground leading-tight" style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}>
            Add New Item
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Log a new item into your home inventory.</p>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">Item saved successfully!</span>
          </div>
        )}

        {/* 2-col layout */}
        <div className="grid grid-cols-[1fr_280px] gap-6 items-start">

          {/* Form */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">

            {/* Section: Basic Info */}
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Basic Information</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Item Name <span className="text-red-400">*</span></label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Sony WH-1000XM5 Headphones"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Category</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => set("category", e.target.value)}
                        className="w-full h-10 pl-3 pr-8 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 appearance-none transition-all"
                      >
                        <option value="">Select category…</option>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Room / Location</label>
                    <div className="relative">
                      <select
                        value={form.room}
                        onChange={(e) => set("room", e.target.value)}
                        className="w-full h-10 pl-3 pr-8 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 appearance-none transition-all"
                      >
                        <option value="">Select room…</option>
                        {ROOMS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={form.qty}
                      onChange={(e) => set("qty", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Estimated Value ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.value}
                      onChange={(e) => set("value", e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Purchase Date</label>
                    <input
                      type="date"
                      value={form.purchaseDate}
                      onChange={(e) => set("purchaseDate", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Condition</label>
                  <div className="flex gap-2 flex-wrap">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => set("condition", form.condition === c ? "" : c)}
                        className={[
                          "h-8 px-3 rounded-lg text-xs font-semibold border transition-colors",
                          form.condition === c
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Section: Details */}
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Product Details</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { field: "brand" as const, label: "Brand", placeholder: "e.g. Sony" },
                  { field: "model" as const, label: "Model", placeholder: "e.g. WH-1000XM5" },
                  { field: "serial" as const, label: "Serial Number", placeholder: "Optional" },
                ].map((f) => (
                  <div key={f.field}>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">{f.label}</label>
                    <input
                      value={form[f.field]}
                      onChange={(e) => set(f.field, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe this item…"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Warranty info, where you bought it, etc."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Photo upload */}
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Photo</p>
              <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/40 hover:bg-accent/[0.02] transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3 group-hover:bg-accent/10 transition-colors">
                  <Upload size={20} className="text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="text-sm font-semibold text-foreground">Drop a photo here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse — PNG, JPG up to 10 MB</p>
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Tags */}
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Tags</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map((tag) => {
                  const active = form.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={[
                        "flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold border transition-colors",
                        active
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {active ? <X size={10} /> : <Plus size={10} />}
                      {tag}
                    </button>
                  );
                })}
              </div>
              {form.tags.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-2">{form.tags.length} tag{form.tags.length > 1 ? "s" : ""} selected</p>
              )}
            </div>

            <div className="border-t border-border/50" />

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm"
              >
                <CheckCircle2 size={14} />Save Item
              </button>
              <button
                onClick={() => setForm(EMPTY)}
                className="flex items-center gap-2 h-10 px-5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Save and Add Another
              </button>
              <button
                onClick={() => onNavigate("allItems")}
                className="h-10 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Preview card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sticky top-6">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4" style={{ letterSpacing: "0.08em" }}>Preview</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Package size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{form.name || "Item Name"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{form.category || "No category"} · {form.room || "No room"}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: "Qty", value: form.qty || "1" },
                { label: "Value", value: form.value ? `$${Number(form.value).toLocaleString()}` : "—" },
                { label: "Condition", value: form.condition || "—" },
                { label: "Brand", value: form.brand || "—" },
                { label: "Model", value: form.model || "—" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-[11px] text-muted-foreground">{r.label}</span>
                  <span className="text-[11px] font-semibold text-foreground truncate max-w-[120px]">{r.value}</span>
                </div>
              ))}
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-accent/10 text-accent text-[10px] font-semibold">
                    <Tag size={8} />{tag}
                  </span>
                ))}
              </div>
            )}
            {!form.name && !form.category && !form.room && (
              <p className="text-[11px] text-muted-foreground/60 text-center mt-4">Fill in the form to see a preview</p>
            )}
          </div>
        </div>

        <div className="h-6" />
      </main>
    </div>
  );
}
