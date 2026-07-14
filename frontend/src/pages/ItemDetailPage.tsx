import { useState } from "react";
import {
  ChevronRight, ArrowLeft, MoveRight, Copy, Pencil, Trash2,
  Camera, Image, Plus, Check, X, Home, CalendarDays, DollarSign,
  Tag, FileText, BookOpen, RotateCcw, Package, ShoppingCart,
  ShieldCheck, SlidersHorizontal, Receipt, AlertTriangle, CheckCircle,
  Layers,
} from "lucide-react";

import { TopNav, NavStrip } from "../components/TopNav";
import { ALL_ITEMS, CATEGORY_COLORS } from "../data/items";
import type { Item } from "../types";
import { deleteItem } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queries/keys";

/* ── Sub-components ──────────────────────────────────────────────── */

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
              <Icon size={13} className="text-muted-foreground" />
            </div>
          )}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-muted-foreground min-w-[110px]">{label}</span>
      <span className={["text-xs font-semibold text-right ml-3", accent ? "text-accent" : "text-foreground"].join(" ")}>
        {value}
      </span>
    </div>
  );
}

/* ── Static detail data ──────────────────────────────────────────── */

const TAG_PALETTE = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-slate-100 text-slate-700 border-slate-200",
];

const CONDITION_STYLE: Record<string, string> = {
  New: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Like New": "bg-teal-50 text-teal-700 border-teal-200",
  Excellent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Good: "bg-blue-50 text-blue-700 border-blue-200",
  Fair: "bg-amber-50 text-amber-700 border-amber-200",
  Poor: "bg-red-50 text-red-700 border-red-200",
};

const ITEM_DETAIL_DATA: Record<number, any> = {
  1: {
    name: "Sony WH-1000XM5 Headphones",
    category: "Electronics", room: "Bedroom", qty: 1, value: 279,
    condition: "Excellent", brand: "Sony", model: "WH-1000XM5",
    serialNumber: "SN-4829-XM5-0041", color: "Midnight Black",
    addedDate: "Jun 2, 2024", updatedDate: "Jun 8, 2024",
    purchaseDate: "May 28, 2024", purchasePrice: 279, purchaseStore: "Best Buy",
    warrantyExpires: "May 28, 2025", warrantyMonthsLeft: 11,
    description: "Noise-canceling over-ear wireless headphones used primarily in the bedroom office setup. Exceptional sound quality with industry-leading active noise cancellation. Up to 30 hours of battery life on a single charge, and compatible with both the iPhone and MacBook Pro via Bluetooth 5.2.",
    tags: ["Audio", "Travel", "Expensive", "Frequently Used", "Warranty"],
    notes: "Keep the charging cable stored in the original case. The left ear cushion shows minor wear but is still fully functional — consider replacing cushions in approximately 6 months. Paired by default to the MacBook Pro in the office.",
    customFields: [
      { label: "Color", value: "Midnight Black" },
      { label: "Connectivity", value: "Bluetooth 5.2" },
      { label: "Battery Life", value: "30 hours" },
      { label: "Driver Size", value: "30mm" },
    ],
    activity: [
      { date: "Jun 8, 2024", action: "Tags updated", detail: "Added 'Travel' and 'Warranty' tags", Icon: Tag, color: "bg-blue-50 text-blue-600" },
      { date: "Jun 5, 2024", action: "Notes updated", detail: "Added charging cable storage note", Icon: FileText, color: "bg-violet-50 text-violet-600" },
      { date: "Jun 2, 2024", action: "Item created", detail: "Added to Bedroom inventory", Icon: Plus, color: "bg-emerald-50 text-emerald-600" },
      { date: "May 28, 2024", action: "Purchase recorded", detail: "$279.00 at Best Buy", Icon: ShoppingCart, color: "bg-orange-50 text-orange-600" },
    ],
    Icon: null,
    iconGradient: "from-blue-50 to-indigo-100",
  },
};

function FALLBACK_DETAIL(item: any) {
  return {
    ...item,
    condition: item.condition || "Not specified",
    brand: item.brand || "—",
    model: item.model || "—",
    serialNumber: item.serialNumber || "—",
    color: "—",
    purchaseDate: item.purchaseDate || "—",
    purchasePrice: null,
    purchaseStore: "—",
    warrantyExpires: "—",
    warrantyMonthsLeft: 0,
    description: item.description || `${item.name} stored in the ${item.room}. Added to inventory ${item.addedDate}.`,
    notes: item.notes || "No notes added yet.",
    customFields: [{ label: "Color", value: "—" }],
    activity: [
      {
        date: item.addedDate,
        action: "Item created",
        detail: `Added to ${item.room} inventory`,
        Icon: Plus,
        color: "bg-emerald-50 text-emerald-600",
      },
    ],
    iconGradient: "from-slate-50 to-slate-100",
  };
}

/* ── Component ───────────────────────────────────────────────────── */

export interface ItemDetailPageProps {
  itemId: Item["id"];
  item?: Item;
  onBack: () => void;
  onDeleted: () => void;
  onSignOut: () => void;
  onItemSelect?: (item: Item) => void;
  onSettings?: () => void;
}

export default function ItemDetailPage({
  itemId,
  item,
  onBack,
  onDeleted,
  onSignOut,
  onItemSelect,
  onSettings,
}: ItemDetailPageProps) {
	const queryClient = useQueryClient();
  const baseItem = item ?? ALL_ITEMS.find((i) => i.id === itemId)!;
  const rawDetail = (typeof itemId === "number" ? ITEM_DETAIL_DATA[itemId] : undefined) ?? FALLBACK_DETAIL(baseItem);
  const detail = { ...rawDetail, Icon: rawDetail.Icon ?? baseItem?.Icon, iconBg: rawDetail.iconBg ?? baseItem?.iconBg, iconColor: rawDetail.iconColor ?? baseItem?.iconColor };
  const relatedItems = typeof itemId === "number"
    ? ALL_ITEMS.filter((i) => i.category === detail.category && i.id !== itemId).slice(0, 3)
    : [];

  const [tags, setTags] = useState<string[]>(detail.tags ?? []);
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(detail.notes ?? "");

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((v) => [...v, t]);
    setTagInput("");
    setAddingTag(false);
  }

  async function handleDelete() {
    if (typeof itemId !== "string") {
      setDeleteError("This sample item is not stored in the database.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteItem(itemId);
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["items"] }),
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
			queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
			queryClient.invalidateQueries({ queryKey: queryKeys.rooms }),
		]);
      onDeleted();
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : "Unable to delete this item.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  const condStyle = CONDITION_STYLE[detail.condition] ?? "bg-slate-50 text-slate-700 border-slate-200";

  if (!baseItem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ fontFamily: "'Figtree', sans-serif" }}>
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Item not found.</p>
          <button onClick={onBack} className="text-sm text-accent font-medium hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <TopNav onSignOut={onSignOut} onSettings={onSettings} />

      <main className="max-w-[1440px] mx-auto px-8 py-7">
        <NavStrip active="inventory" onSelect={(id) => { if (id !== "inventory") onBack(); }} />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 mb-5">
          <button onClick={onBack} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight size={13} />
          <button onClick={onBack} className="hover:text-foreground transition-colors">All Items</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium truncate max-w-xs">{detail.name}</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-7 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[detail.category] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>
                {detail.category}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${condStyle}`}>
                {detail.condition}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                Active
              </span>
            </div>
            <h1
              className="text-[30px] font-bold text-foreground leading-tight"
              style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}
            >
              {detail.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1.5"><Home size={12} />{detail.room}</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5"><CalendarDays size={12} />Added {detail.addedDate}</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5"><DollarSign size={12} />Est. value ${detail.value}</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <ArrowLeft size={14} />Back
            </button>
            <button className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
              <MoveRight size={14} />Move
            </button>
            <button className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
              <Copy size={14} />Duplicate
            </button>
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm">
              <Pencil size={14} />Edit Item
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm"
              >
                <Trash2 size={14} />Delete
              </button>
            ) : (
              <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-red-300 bg-red-50">
                <AlertTriangle size={13} className="text-red-500" />
                <span className="text-xs font-semibold text-red-600">Sure?</span>
                <button onClick={handleDelete} disabled={deleting} className="text-xs font-bold text-red-600 hover:text-red-800 px-1 disabled:opacity-60">{deleting ? "Deleting…" : "Yes"}</button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground px-1"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        {deleteError && (
          <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {deleteError}
          </div>
        )}

        {/* Main 2-col layout */}
        <div className="grid grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── LEFT COLUMN ─────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Image / Photos card */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className={`relative h-72 bg-gradient-to-br ${detail.iconGradient} flex items-center justify-center group`}>
                {detail.photoUrl ? (
                  <img src={detail.photoUrl} alt={detail.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {detail.Icon && (
                      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${detail.iconBg} shadow-lg`}>
                        <detail.Icon size={48} className={detail.iconColor} />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground font-medium">No photos added yet</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-end p-4">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 h-8 px-3 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-semibold text-foreground shadow-md hover:bg-white">
                    <Camera size={13} />Add Photo
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm text-muted-foreground shadow-sm">
                    <Image size={10} className="inline mr-1" />{detail.photoUrl ? 1 : 0} photo{detail.photoUrl ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 border-t border-border/60">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={["w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all", activePhoto === i ? "border-accent bg-accent/5" : "border-border bg-muted hover:border-accent/40"].join(" ")}
                  >
                    <Image size={18} className="text-muted-foreground/40" />
                  </button>
                ))}
                <button className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-accent/40 hover:bg-muted transition-all group ml-auto">
                  <Plus size={18} className="text-muted-foreground/40 group-hover:text-accent transition-colors" />
                </button>
              </div>
            </div>

            {/* Description */}
            <SectionCard
              title="Description"
              icon={BookOpen}
              action={<button className="flex items-center gap-1.5 text-xs text-accent font-medium hover:underline"><Pencil size={11} />Edit</button>}
            >
              <p className="text-sm text-foreground/80 leading-relaxed">{detail.description}</p>
            </SectionCard>

            {/* Tags */}
            <SectionCard title="Tags" icon={Tag}>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <div
                    key={tag}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${TAG_PALETTE[i % TAG_PALETTE.length]}`}
                  >
                    {tag}
                    <button
                      onClick={() => setTags((v) => v.filter((t) => t !== tag))}
                      className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
                    >
                      <X size={10} />
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
                    <button
                      onClick={addTag}
                      className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90 transition-colors"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => { setAddingTag(false); setTagInput(""); }}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <X size={12} className="text-muted-foreground" />
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
            </SectionCard>

            {/* Notes */}
            <SectionCard
              title="Notes"
              icon={FileText}
              action={
                editingNotes ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingNotes(false)} className="text-xs font-semibold text-accent hover:underline">Save</button>
                    <button onClick={() => { setNotesVal(detail.notes); setEditingNotes(false); }} className="text-xs font-semibold text-muted-foreground hover:underline">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1.5 text-xs text-accent font-medium hover:underline">
                    <Pencil size={11} />Edit
                  </button>
                )
              }
            >
              {editingNotes ? (
                <textarea
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  rows={4}
                  className="w-full text-sm text-foreground/80 leading-relaxed bg-muted/50 rounded-xl px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent/25 resize-none"
                />
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {notesVal || <span className="text-muted-foreground italic">No notes added yet.</span>}
                </p>
              )}
            </SectionCard>

            {/* Activity log */}
            <SectionCard
              title="Recent Changes"
              icon={RotateCcw}
              action={<button className="text-xs text-accent font-medium hover:underline">View all</button>}
            >
              <div className="space-y-1">
                {detail.activity.map((ev: any, i: number) => (
                  <div key={i} className="flex items-start gap-3.5 py-2.5 border-b border-border/40 last:border-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${ev.color}`}>
                      <ev.Icon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{ev.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ev.detail}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0 mt-0.5">{ev.date}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Item Details */}
            <SectionCard title="Item Details" icon={Package}>
              <MetaRow label="Category" value={<span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[detail.category] ?? ""}`}>{detail.category}</span>} />
              <MetaRow label="Room" value={detail.room} />
              <MetaRow label="Quantity" value={`${detail.qty} unit${detail.qty !== 1 ? "s" : ""}`} />
              <MetaRow label="Condition" value={<span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${condStyle}`}>{detail.condition}</span>} />
              <MetaRow label="Brand" value={detail.brand} />
              <MetaRow label="Model" value={detail.model} />
              <MetaRow label="Serial No." value={detail.serialNumber} />
              <MetaRow label="Date Added" value={detail.addedDate} />
              <MetaRow label="Last Updated" value={detail.updatedDate} />
              <MetaRow label="Est. Value" value={`$${detail.value.toLocaleString()}`} accent />
            </SectionCard>

            {/* Purchase Information */}
            <SectionCard
              title="Purchase Information"
              icon={ShoppingCart}
              action={<button className="text-xs text-accent font-medium hover:underline">Edit</button>}
            >
              <MetaRow label="Purchase Date" value={detail.purchaseDate} />
              <MetaRow label="Store / Seller" value={detail.purchaseStore} />
              <MetaRow label="Purchase Price" value={detail.purchasePrice == null ? "—" : `$${detail.purchasePrice.toLocaleString()}`} accent={detail.purchasePrice != null} />
              <div className="mt-3">
                <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-accent transition-colors">
                  <Receipt size={13} />Attach receipt or invoice
                </button>
              </div>
            </SectionCard>

            {/* Warranty & Insurance */}
            <SectionCard title="Warranty & Insurance" icon={ShieldCheck}>
              {detail.warrantyExpires !== "—" ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">Expires</span>
                    <span className="text-xs font-semibold text-foreground">{detail.warrantyExpires}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700">Warranty active</p>
                      <p className="text-[11px] text-emerald-600/80 mt-0.5">{detail.warrantyMonthsLeft} months remaining</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${(detail.warrantyMonthsLeft / 12) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">Coverage: {detail.warrantyMonthsLeft}/12 months remaining</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-3 text-center">
                  <p className="text-sm text-muted-foreground">No warranty recorded</p>
                  <button className="mt-2 text-xs text-accent font-medium hover:underline">Add warranty info</button>
                </div>
              )}
            </SectionCard>

            {/* Custom Fields */}
            <SectionCard
              title="Custom Fields"
              icon={SlidersHorizontal}
              action={<button className="text-xs text-accent font-medium hover:underline">+ Add field</button>}
            >
              {detail.customFields.map((f: { label: string; value: string }) => (
                <MetaRow key={f.label} label={f.label} value={f.value} />
              ))}
            </SectionCard>

            {/* Related Items */}
            {relatedItems.length > 0 && (
              <SectionCard
                title="Related Items"
                icon={Layers}
                action={<button className="text-xs text-accent font-medium hover:underline">See all</button>}
              >
                <div className="space-y-2">
                  {relatedItems.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onItemSelect?.(rel)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${rel.iconBg}`}>
                        <rel.Icon size={15} className={rel.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{rel.name}</p>
                        <p className="text-[11px] text-muted-foreground">{rel.room} · ${rel.value}</p>
                      </div>
                      <ChevronRight size={13} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>

        <div className="h-10" />
      </main>

      <style>{`
        .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
