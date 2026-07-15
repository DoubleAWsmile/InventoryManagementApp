import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ChevronRight, Package, Plus, Tag, X } from "lucide-react";
import { TopNav, NavStrip } from "../components/TopNav";
import { addItemToCache, replaceItemInCache } from "../queries/itemCache";
import { queryKeys } from "../queries/keys";
import { createItem, getCategories, getRooms, updateItem, type ApiItem, type CreateItemPayload } from "../services/api";
import type { Item, PageName } from "../types";

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const TAGS = ["Warranty", "Expensive", "Frequently Used", "Travel", "Fragile", "Insured", "Gift", "Seasonal"];

interface FormState {
  name: string; quantity: string; categoryId: string; roomId: string; value: string;
  purchaseDate: string; condition: string; brand: string; model: string; serialNumber: string;
  description: string; notes: string; tags: string[];
}

function dateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function initialState(item?: Item): FormState {
  return {
    name: item?.name ?? "", quantity: String(item?.qty ?? 1), categoryId: item?.categoryId ?? "",
    roomId: item?.roomId ?? "", value: item?.value ? String(item.value) : "",
    purchaseDate: dateInput(item?.purchaseDate), condition: item?.condition ?? "", brand: item?.brand ?? "",
    model: item?.model ?? "", serialNumber: item?.serialNumber ?? "", description: item?.description ?? "",
    notes: item?.notes ?? "", tags: item?.tags ?? [],
  };
}

export interface ItemFormPageProps {
  mode: "create" | "edit";
  item?: Item;
  onSaved: (item: ApiItem) => void;
  onCancel: () => void;
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function ItemFormPage({ mode, item, onSaved, onCancel, onSignOut, onNavigate, onSettings }: ItemFormPageProps) {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: getCategories });
  const roomsQuery = useQuery({ queryKey: queryKeys.rooms, queryFn: getRooms });
  const [form, setForm] = useState(() => initialState(item));
  const [showDetails, setShowDetails] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: CreateItemPayload) => mode === "edit" && typeof item?.id === "string"
      ? updateItem(item.id, payload) : createItem(payload),
    onSuccess: async (canonicalItem) => {
      if (mode === "edit") replaceItemInCache(queryClient, canonicalItem);
      else addItemToCache(queryClient, canonicalItem);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
        queryClient.invalidateQueries({ queryKey: queryKeys.rooms }),
      ]);
      onSaved(canonicalItem);
    },
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setError(null);
    if (!form.name.trim()) { setError("Item name is required."); return; }
    const quantity = Number(form.quantity);
    const estimatedValue = form.value === "" ? null : Number(form.value);
    if (!Number.isInteger(quantity) || quantity < 1) { setError("Quantity must be at least 1."); return; }
    if (estimatedValue !== null && (!Number.isFinite(estimatedValue) || estimatedValue < 0)) { setError("Estimated value must be 0 or greater."); return; }
    try {
      await mutation.mutateAsync({
        name: form.name.trim(), quantity, categoryId: form.categoryId || null, roomId: form.roomId || null,
        estimatedValue, purchaseDate: form.purchaseDate ? new Date(`${form.purchaseDate}T00:00:00`).toISOString() : null,
        condition: form.condition, brand: form.brand.trim(), model: form.model.trim(), serialNumber: form.serialNumber.trim(),
        description: form.description.trim(), notes: form.notes.trim(), tags: form.tags,
        photoUrl: item?.photoUrl ?? "", photoFilename: item?.photoFilename ?? "", photoMimeType: item?.photoMimeType ?? "",
        photoSizeBytes: item?.photoSizeBytes ?? null,
      });
      setSaved(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `Unable to ${mode} item.`);
    }
  };

  const categories = categoriesQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25";

  return <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
    <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />
    <main className="max-w-[1000px] mx-auto px-8 py-7 space-y-6">
      <NavStrip active={mode === "create" ? "add" : "inventory"} onSelect={(id) => id === "inventory" && onNavigate("allItems")} />
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><button onClick={() => onNavigate("allItems")}>Inventory</button><ChevronRight size={13} /><span className="text-foreground">{mode === "create" ? "Add Item" : "Edit Item"}</span></div>
      <div><h1 className="text-[26px] font-bold" style={{ fontFamily: "'Instrument Serif', serif" }}>{mode === "create" ? "Add New Item" : `Edit ${item?.name ?? "Item"}`}</h1><p className="text-sm text-muted-foreground mt-1">{mode === "create" ? "Start with the essentials. Add details only when useful." : "Update the item details below."}</p></div>
      {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Item saved successfully.</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-[1fr_160px] gap-4">
          <div><label className="block text-xs font-semibold mb-1.5">Item Name <span className="text-red-400">*</span></label><input autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="What are you adding?" className={inputClass} /></div>
          <div><label className="block text-xs font-semibold mb-1.5">Quantity</label><input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className={inputClass} /></div>
        </div>
        <button type="button" onClick={() => setShowDetails((value) => !value)} className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold hover:bg-muted/60"><span>{showDetails ? "Hide additional details" : "Add category, room, value, and other details"}</span><ChevronDown size={15} className={showDetails ? "rotate-180" : ""} /></button>
        {showDetails && <div className="space-y-5 border-t border-border/60 pt-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold mb-1.5">Category</label><select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputClass}><option value="">Unassigned</option>{categories.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></div>
            <div><label className="block text-xs font-semibold mb-1.5">Room</label><select value={form.roomId} onChange={(e) => set("roomId", e.target.value)} className={inputClass}><option value="">Unassigned</option>{rooms.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-semibold mb-1.5">Estimated Value ($)</label><input type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)} className={inputClass} /></div><div><label className="block text-xs font-semibold mb-1.5">Purchase Date</label><input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} className={inputClass} /></div></div>
          <div><label className="block text-xs font-semibold mb-2">Condition</label><div className="flex flex-wrap gap-2">{CONDITIONS.map((value) => <button type="button" key={value} onClick={() => set("condition", form.condition === value ? "" : value)} className={`h-8 rounded-lg border px-3 text-xs font-semibold ${form.condition === value ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>{value}</button>)}</div></div>
          <div className="grid grid-cols-3 gap-4">{(["brand", "model", "serialNumber"] as const).map((key) => <div key={key}><label className="block text-xs font-semibold mb-1.5">{key === "serialNumber" ? "Serial Number" : key[0].toUpperCase() + key.slice(1)}</label><input value={form[key]} onChange={(e) => set(key, e.target.value)} className={inputClass} /></div>)}</div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-semibold mb-1.5">Description</label><textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputClass} h-auto py-2`} /></div><div><label className="block text-xs font-semibold mb-1.5">Notes</label><textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${inputClass} h-auto py-2`} /></div></div>
          <div><label className="block text-xs font-semibold mb-2">Tags</label><div className="flex flex-wrap gap-2">{TAGS.map((tag) => { const selected = form.tags.includes(tag); return <button type="button" key={tag} onClick={() => set("tags", selected ? form.tags.filter((value) => value !== tag) : [...form.tags, tag])} className={`flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${selected ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>{selected ? <X size={10} /> : <Plus size={10} />}{tag}</button>; })}</div></div>
        </div>}
        <div className="flex gap-3 border-t border-border/60 pt-5"><button onClick={save} disabled={mutation.isPending} className="flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground disabled:opacity-60"><CheckCircle2 size={14} />{mutation.isPending ? "Saving…" : mode === "create" ? "Add Item" : "Save Changes"}</button><button onClick={onCancel} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button></div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Package size={13} /><span>Only item name and quantity are needed to get started.</span><Tag size={12} /></div>
    </main>
  </div>;
}
