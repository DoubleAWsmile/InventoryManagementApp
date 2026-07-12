import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  active?: boolean;
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export default function FilterChip({ label, active, removable, onClick, onRemove }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs font-semibold border transition-colors select-none",
        active
          ? "bg-accent text-accent-foreground border-accent"
          : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-accent/40",
      ].join(" ")}
    >
      {label}
      {removable && active && (
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          className="ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-accent-foreground/20 transition-colors"
        >
          <X size={9} />
        </span>
      )}
    </button>
  );
}
