import { useState, type Dispatch, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { NavStrip, TopNav } from "../components/TopNav";
import { AppButton, IconTile, Surface } from "../components/AppUI";
import { queryKeys } from "../queries/keys";
import {
  createWishlistItem,
  deleteWishlistItem,
  getItemOptions,
  getWishlist,
  updateWishlistItem,
  type ItemOption,
  type WishlistItem,
  type WishlistPayload,
  type WishlistPriority,
  type WishlistStatus,
} from "../services/api";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";

const PRIORITIES: WishlistPriority[] = ["low", "medium", "high"];
const STATUSES: WishlistStatus[] = ["wanted", "considering", "purchased", "cancelled"];

const EMPTY_FORM: WishlistPayload = {
  itemName: "",
  categoryId: "",
  brand: "",
  model: "",
  estimatedCost: null,
  itemUrl: "",
  notes: "",
  priority: "medium",
  status: "wanted",
};

const PRIORITY_STYLE: Record<WishlistPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

const STATUS_STYLE: Record<WishlistStatus, string> = {
  wanted: "bg-blue-50 text-blue-600 border border-blue-200",
  considering: "bg-violet-50 text-violet-600 border border-violet-200",
  purchased: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  cancelled: "bg-slate-50 text-slate-600 border border-slate-200",
};

const inputClass = "mt-1 w-full h-9 px-3 rounded-lg border border-border bg-background";
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const formatCost = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function itemToPayload(item: WishlistItem): WishlistPayload {
  return {
    categoryId: item.categoryId,
    itemName: item.itemName,
    brand: item.brand,
    model: item.model,
    estimatedCost: item.estimatedCost,
    itemUrl: item.itemUrl,
    notes: item.notes,
    priority: item.priority,
    status: item.status,
  };
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  Icon: LucideIcon;
  iconClass: string;
}

function StatCard({ label, value, sub, Icon, iconClass }: StatCardProps) {
  return (
    <Surface>
      <IconTile Icon={Icon} className={`mb-3 ${iconClass}`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </Surface>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, values, onChange }: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 pl-3 pr-8 rounded-lg border border-border bg-card text-xs font-semibold appearance-none"
      >
        <option value="all">{label}</option>
        {values.map((option) => (
          <option value={option} key={option}>
            {titleCase(option)}
          </option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2.5 top-2.5 pointer-events-none" />
    </div>
  );
}

interface WishlistCardProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onRemove: (id: string) => void;
  onStatusChange: (item: WishlistItem, status: WishlistStatus) => void;
}

function WishlistCard({ item, onEdit, onRemove, onStatusChange }: WishlistCardProps) {
  const isInactive = item.status === "purchased" || item.status === "cancelled";

  return (
    <div
      className={`bg-card rounded-2xl border border-border p-4 shadow-sm ${isInactive ? "opacity-60" : ""}`}
      onDoubleClick={() => onEdit(item)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Package size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex gap-2 items-center">
            <p className={`text-sm font-bold ${item.status === "purchased" ? "line-through" : ""}`}>
              {item.itemName}
            </p>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${PRIORITY_STYLE[item.priority]}`}
            >
              {titleCase(item.priority)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {item.category || "Uncategorized"}
            {item.brand && ` · ${item.brand}${item.model ? ` ${item.model}` : ""}`}
          </p>
          {item.notes && <p className="text-[11px] text-muted-foreground mt-1 truncate">{item.notes}</p>}
        </div>

        {item.estimatedCost != null && (
          <span className="text-sm font-bold">{formatCost(item.estimatedCost)}</span>
        )}
        {item.itemUrl && (
          <a
            href={item.itemUrl}
            target="_blank"
            rel="noopener noreferrer"
            onDoubleClick={(event) => event.stopPropagation()}
            className="p-2 text-accent"
            aria-label={`Open link for ${item.itemName}`}
          >
            <ExternalLink size={15} />
          </a>
        )}
        <select
          aria-label={`Status for ${item.itemName}`}
          value={item.status}
          onChange={(event) => onStatusChange(item, event.target.value as WishlistStatus)}
          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_STYLE[item.status]}`}
        >
          {STATUSES.map((status) => (
            <option value={status} key={status}>
              {titleCase(status)}
            </option>
          ))}
        </select>
        <button
          onClick={() => onEdit(item)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border"
        >
          Edit
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-red-600"
          aria-label={`Delete ${item.itemName}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

interface WishlistFormProps {
  editing: boolean;
  form: WishlistPayload;
  setForm: Dispatch<SetStateAction<WishlistPayload>>;
  categories: ItemOption[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
}

function WishlistForm({
  editing,
  form,
  setForm,
  categories,
  saving,
  error,
  onClose,
  onSave,
}: WishlistFormProps) {
  const update = <K extends keyof WishlistPayload>(key: K, value: WishlistPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between mb-5">
          <h2 className="text-lg font-bold">{editing ? "Edit" : "Add"} Wishlist Item</h2>
          <button onClick={onClose} aria-label="Close wishlist form">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 text-xs font-semibold">
            Item name
            <input
              autoFocus
              value={form.itemName}
              onChange={(e) => update("itemName", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold">
            Category
            <select
              value={form.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
              className={inputClass}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Priority
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value as WishlistPriority)}
              className={inputClass}
            >
              {PRIORITIES.map((priority) => (
                <option value={priority} key={priority}>
                  {titleCase(priority)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Brand
            <input
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold">
            Model
            <input
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold">
            Estimated cost
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedCost ?? ""}
              onChange={(e) => update("estimatedCost", e.target.value === "" ? null : Number(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold">
            Item link
            <input
              type="url"
              placeholder="https://…"
              value={form.itemUrl}
              onChange={(e) => update("itemUrl", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="col-span-2 text-xs font-semibold">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className={`${inputClass} h-auto p-3`}
              rows={3}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="h-9 px-4 border border-border rounded-lg text-sm">
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={onSave}
            className="h-9 px-4 bg-accent text-accent-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface WishlistPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function WishlistPage({ onSignOut, onNavigate, onSettings }: WishlistPageProps) {
  const queryClient = useQueryClient();
  const wishlistQuery = useQuery({ queryKey: queryKeys.wishlist, queryFn: getWishlist });
  const optionsQuery = useQuery({ queryKey: ["itemOptions"], queryFn: getItemOptions });

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WishlistPayload>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = wishlistQuery.data ?? [];
  const categories = optionsQuery.data?.categories ?? [];
  const filteredItems = items.filter(
    (item) =>
      (priorityFilter === "all" || item.priority === priorityFilter) &&
      (statusFilter === "all" || item.status === statusFilter) &&
      (categoryFilter === "all" || item.categoryId === categoryFilter),
  );
  const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);
  const highPriorityCount = items.filter((item) => item.priority === "high").length;
  const purchasedCount = items.filter((item) => item.status === "purchased").length;

  const refreshWishlist = () => queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });

  const openForm = (item?: WishlistItem) => {
    setEditingId(item?.id ?? null);
    setForm(item ? itemToPayload(item) : { ...EMPTY_FORM });
    setError(null);
    setShowForm(true);
  };

  const saveItem = async () => {
    if (!form.itemName.trim()) {
      setError("Item name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) await updateWishlistItem(editingId, form);
      else await createWishlistItem(form);
      await refreshWishlist();
      setShowForm(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save wishlist item.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item: WishlistItem, status: WishlistStatus) => {
    try {
      await updateWishlistItem(item.id, { ...itemToPayload(item), status });
      await refreshWishlist();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update item.");
    }
  };

  const removeItem = async (id: string) => {
    if (!window.confirm("Remove this wishlist item?")) return;
    try {
      await deleteWishlistItem(id);
      await refreshWishlist();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove item.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />
      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID.wishlist ?? "wishlist"}
          onSelect={(id) => {
            const page = NAV_ID_TO_PAGE[id];
            if (page) onNavigate(page);
          }}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")}>Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Wishlist</span>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-[26px]">Wishlist</h1>
            <p className="text-sm text-muted-foreground mt-1">Track purchases you want or are considering.</p>
          </div>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
          >
            <Plus size={14} /> Add Wishlist Item
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Items"
            value={items.length}
            sub="On wishlist"
            Icon={ShoppingCart}
            iconClass="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Est. Total Cost"
            value={formatCost(totalCost)}
            sub="Known estimates"
            Icon={TrendingUp}
            iconClass="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="High Priority"
            value={highPriorityCount}
            sub="Need attention"
            Icon={AlertCircle}
            iconClass="bg-red-50 text-red-600"
          />
          <StatCard
            label="Purchased"
            value={purchasedCount}
            sub="Completed"
            Icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </div>

        {error && !showForm && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <FilterSelect
            label="All Priorities"
            value={priorityFilter}
            values={["high", "medium", "low"]}
            onChange={setPriorityFilter}
          />
          <FilterSelect
            label="All Statuses"
            value={statusFilter}
            values={STATUSES}
            onChange={setStatusFilter}
          />
          <div className="relative">
            <select
              aria-label="All Categories"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-8 pl-3 pr-8 rounded-lg border border-border bg-card text-xs font-semibold appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {wishlistQuery.isLoading && (
          <p className="text-sm text-muted-foreground py-12 text-center">Loading wishlist…</p>
        )}
        {wishlistQuery.isError && (
          <p className="text-sm text-red-600 py-12 text-center">Unable to load wishlist.</p>
        )}
        {wishlistQuery.isSuccess && (
          <div className="grid gap-3">
            {filteredItems.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No wishlist items match these filters.
              </div>
            )}
            {filteredItems.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                onEdit={openForm}
                onRemove={removeItem}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <WishlistForm
          editing={editingId !== null}
          form={form}
          setForm={setForm}
          categories={categories}
          saving={saving}
          error={error}
          onClose={() => setShowForm(false)}
          onSave={saveItem}
        />
      )}
    </div>
  );
}
