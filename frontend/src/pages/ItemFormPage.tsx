import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ChevronRight, Package, Plus, Tag, X } from "lucide-react";
import { NavStrip, TopNav } from "../components/TopNav";
import { AppButton, AppInput, FeedbackBanner, FormField, Surface, controlClass } from "../components/AppUI";
import { addItemToCache, replaceItemInCache } from "../queries/itemCache";
import { queryKeys } from "../queries/keys";
import {
  createItem,
  getCategories,
  getRooms,
  updateItem,
  type ApiItem,
  type CreateItemPayload,
} from "../services/api";
import type { Item, PageName } from "../types";
import { NAV_ID_TO_PAGE } from "../utils/nav";

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const TAGS = ["Warranty", "Expensive", "Frequently Used", "Travel", "Fragile", "Insured", "Gift", "Seasonal"];

interface FormState {
  name: string;
  quantity: string;
  categoryId: string;
  roomId: string;
  value: string;
  purchaseDate: string;
  condition: string;
  brand: string;
  model: string;
  serialNumber: string;
  description: string;
  notes: string;
  tags: string[];
}

function toDateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function initialState(item?: Item): FormState {
  return {
    name: item?.name ?? "",
    quantity: String(item?.qty ?? 1),
    categoryId: item?.categoryId ?? "",
    roomId: item?.roomId ?? "",
    value: item?.value ? String(item.value) : "",
    purchaseDate: toDateInput(item?.purchaseDate),
    condition: item?.condition ?? "",
    brand: item?.brand ?? "",
    model: item?.model ?? "",
    serialNumber: item?.serialNumber ?? "",
    description: item?.description ?? "",
    notes: item?.notes ?? "",
    tags: item?.tags ?? [],
  };
}

function buildPayload(form: FormState, item?: Item): CreateItemPayload {
  return {
    name: form.name.trim(),
    quantity: Number(form.quantity),
    categoryId: form.categoryId || null,
    roomId: form.roomId || null,
    estimatedValue: form.value === "" ? null : Number(form.value),
    purchaseDate: form.purchaseDate ? new Date(`${form.purchaseDate}T00:00:00`).toISOString() : null,
    condition: form.condition,
    brand: form.brand.trim(),
    model: form.model.trim(),
    serialNumber: form.serialNumber.trim(),
    description: form.description.trim(),
    notes: form.notes.trim(),
    tags: form.tags,
    photoUrl: item?.photoUrl ?? "",
    photoFilename: item?.photoFilename ?? "",
    photoMimeType: item?.photoMimeType ?? "",
    photoSizeBytes: item?.photoSizeBytes ?? null,
  };
}

function validateForm(form: FormState) {
  if (!form.name.trim()) return "Item name is required.";
  const quantity = Number(form.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) return "Quantity must be at least 1.";
  const estimatedValue = form.value === "" ? null : Number(form.value);
  if (estimatedValue !== null && (!Number.isFinite(estimatedValue) || estimatedValue < 0)) {
    return "Estimated value must be 0 or greater.";
  }
  return null;
}

interface AdditionalDetailsProps {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

function AdditionalDetails({ form, set }: AdditionalDetailsProps) {
  const toggleTag = (tag: string) => {
    set("tags", form.tags.includes(tag) ? form.tags.filter((value) => value !== tag) : [...form.tags, tag]);
  };

  return (
    <div className="space-y-5 border-t border-border/60 pt-5">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Estimated Value ($)">
          <AppInput type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)} />
        </FormField>
        <FormField label="Purchase Date">
          <AppInput
            type="date"
            value={form.purchaseDate}
            onChange={(e) => set("purchaseDate", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Condition">
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((condition) => (
            <button
              type="button"
              key={condition}
              onClick={() => set("condition", form.condition === condition ? "" : condition)}
              className={`h-8 rounded-lg border px-3 text-xs font-semibold ${form.condition === condition ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
            >
              {condition}
            </button>
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Brand">
          <AppInput value={form.brand} onChange={(e) => set("brand", e.target.value)} />
        </FormField>
        <FormField label="Model">
          <AppInput value={form.model} onChange={(e) => set("model", e.target.value)} />
        </FormField>
        <FormField label="Serial Number">
          <AppInput value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={`${controlClass} h-auto py-2`}
          />
        </FormField>
        <FormField label="Notes">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={`${controlClass} h-auto py-2`}
          />
        </FormField>
      </div>

      <FormField label="Tags">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const selected = form.tags.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${selected ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
              >
                {selected ? <X size={10} /> : <Plus size={10} />}
                {tag}
              </button>
            );
          })}
        </div>
      </FormField>
    </div>
  );
}

export interface ItemFormPageProps {
  mode: "create" | "edit";
  item?: Item;
  onSaved: (item: ApiItem) => void;
  onCancel: () => void;
  onSignOut: () => void;
  onNavigate: (page: PageName, value?: string) => void;
  onSettings?: () => void;
}

export default function ItemFormPage({
  mode,
  item,
  onSaved,
  onCancel,
  onSignOut,
  onNavigate,
  onSettings,
}: ItemFormPageProps) {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: getCategories });
  const roomsQuery = useQuery({ queryKey: queryKeys.rooms, queryFn: getRooms });
  const [form, setForm] = useState(() => initialState(item));
  const [showDetails, setShowDetails] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: CreateItemPayload) =>
      mode === "edit" && typeof item?.id === "string" ? updateItem(item.id, payload) : createItem(payload),
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

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    const validationError = validateForm(form);
    setError(validationError);
    if (validationError) return;

    try {
      await mutation.mutateAsync(buildPayload(form, item));
      setSaved(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `Unable to ${mode} item.`);
    }
  };

  const categories = categoriesQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const isCreate = mode === "create";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />
      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={isCreate ? "add" : "inventory"}
          onSelect={(id) => {
            const page = NAV_ID_TO_PAGE[id];
            if (page) onNavigate(page);
          }}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("allItems")}>Inventory</button>
          <ChevronRight size={13} />
          <span className="text-foreground">{isCreate ? "Add Item" : "Edit Item"}</span>
        </div>

        <div>
          <h1 className="font-display text-[26px]">
            {isCreate ? "Add New Item" : `Edit ${item?.name ?? "Item"}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isCreate
              ? "Start with the essentials. Add details only when useful."
              : "Update the item details below."}
          </p>
        </div>

        {saved && <FeedbackBanner tone="success">Item saved successfully.</FeedbackBanner>}
        {error && <FeedbackBanner tone="danger">{error}</FeedbackBanner>}

        <Surface padding="lg" className="max-w-[1000px] space-y-5">
          <div className="grid grid-cols-[1fr_160px] gap-4">
            <FormField label="Item Name" required>
              <AppInput
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="What are you adding?"
              />
            </FormField>
            <FormField label="Quantity">
              <AppInput
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" optional>
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className={`${controlClass} h-10`}
              >
                <option value="">Unassigned</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Room" optional>
              <select
                value={form.roomId}
                onChange={(e) => set("roomId", e.target.value)}
                className={`${controlClass} h-10`}
              >
                <option value="">Unassigned</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold hover:bg-muted/60"
          >
            <span>
              {showDetails
                ? "Hide additional details"
                : "Add value, condition, product information, and notes"}
            </span>
            <ChevronDown size={15} className={showDetails ? "rotate-180" : ""} />
          </button>

          {showDetails && <AdditionalDetails form={form} set={set} />}

          <div className="flex gap-3 border-t border-border/60 pt-5">
            <AppButton
              onClick={save}
              disabled={mutation.isPending}
              variant="primary"
              size="lg"
              Icon={CheckCircle2}
            >
              {mutation.isPending ? "Saving…" : isCreate ? "Add Item" : "Save Changes"}
            </AppButton>
            <AppButton onClick={onCancel} size="lg">
              Cancel
            </AppButton>
          </div>
        </Surface>

        <div className="max-w-[1000px] flex items-center gap-2 text-xs text-muted-foreground">
          <Package size={13} />
          <span>Only the item name is required. Category and room can remain unassigned.</span>
          <Tag size={12} />
        </div>
      </main>
    </div>
  );
}
