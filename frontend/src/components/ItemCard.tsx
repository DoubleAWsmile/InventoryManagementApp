import { Home, Tag, MoreHorizontal, ExternalLink } from "lucide-react";
import { CATEGORY_COLORS, TAG_COLORS } from "../data/items";
import type { IconComponent } from "../types";

/* ── Shared card props ───────────────────────────────────────────── */

interface BaseItemCardProps {
  id: string | number;
  name: string;
  category: string;
  room: string;
  qty: number;
  Icon: IconComponent;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}

/* ── Compact card (dashboard "Recently Added") ───────────────────── */

export interface CompactItemCardProps extends BaseItemCardProps {}

export function CompactItemCard({
  name,
  category,
  room,
  qty,
  Icon,
  iconBg,
  iconColor,
  onClick,
}: CompactItemCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>

      <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-2">
        {name}
      </h3>

      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Home size={10} />
          <span>{room}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Tag size={10} />
          <span>{category}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Qty {qty}
        </span>
        <button className="text-muted-foreground/40 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Full card (All Items grid view) ─────────────────────────────── */

export interface FullItemCardProps extends BaseItemCardProps {
  value?: number;
  addedDate?: string;
  updatedDate?: string;
  tags?: string[];
  lowStock?: boolean;
  missingInfo?: boolean;
  currencySymbol?: string;
}

export function FullItemCard({
  name,
  category,
  room,
  qty,
  value,
  addedDate,
  updatedDate,
  tags = [],
  lowStock = false,
  missingInfo = false,
  currencySymbol = "$",
  Icon,
  iconBg,
  iconColor,
  onClick,
}: FullItemCardProps) {
  const catColor =
    CATEGORY_COLORS[category] ?? "bg-slate-50 text-slate-700 border-slate-200";
  const shortDate = (d?: string) => d?.replace(", 2024", "").replace(", 2023", "") ?? "";

  return (
    <div
      onClick={onClick}
      className="group bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative"
    >
      {/* Status badges */}
      <div className="absolute top-3.5 right-3.5 flex gap-1">
        {lowStock && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
            LOW
          </span>
        )}
        {missingInfo && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600">
            INFO
          </span>
        )}
      </div>

      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-foreground leading-snug mb-1 pr-8 line-clamp-2">
        {name}
      </h3>

      {/* Category badge */}
      <div className="mb-3">
        <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
          {category}
        </span>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
        <div>
          <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Room</p>
          <p className="text-[11px] text-foreground font-semibold truncate">{room}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Qty</p>
          <p className="text-[11px] text-foreground font-semibold">{qty}</p>
        </div>
        {value !== undefined && (
          <div>
            <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Value</p>
            <p className="text-[11px] text-foreground font-semibold">{currencySymbol}{value}</p>
          </div>
        )}
        {addedDate && (
          <div>
            <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Added</p>
            <p className="text-[11px] text-foreground font-semibold">{shortDate(addedDate)}</p>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag, i) => (
            <span
              key={tag}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${TAG_COLORS[i % TAG_COLORS.length]}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <span className="text-[10px] text-muted-foreground">
          {updatedDate ? `Updated ${shortDate(updatedDate)}` : ""}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ExternalLink size={11} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <MoreHorizontal size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Default export: alias for CompactItemCard ───────────────────── */

export default CompactItemCard;
