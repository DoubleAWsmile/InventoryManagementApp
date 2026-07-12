import type { IconComponent } from "../types";

export interface FeatureCardProps {
  label: string;
  desc: string;
  Icon: IconComponent;
  isActive?: boolean;
  isHighlight?: boolean;
  onClick: () => void;
}

export default function FeatureCard({
  label,
  desc,
  Icon,
  isActive = false,
  isHighlight = false,
  onClick,
}: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-150 text-left",
        isHighlight
          ? "bg-accent text-accent-foreground border-accent hover:bg-accent/90 shadow-sm"
          : isActive
          ? "bg-card border-accent/40 text-foreground shadow-sm ring-1 ring-accent/20"
          : "bg-card border-border text-muted-foreground hover:text-foreground hover:shadow-sm",
      ].join(" ")}
    >
      <div
        className={[
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
          isHighlight ? "bg-white/20" : isActive ? "bg-accent/10" : "bg-muted",
        ].join(" ")}
      >
        <Icon
          size={14}
          className={isHighlight ? "text-white" : isActive ? "text-accent" : ""}
        />
      </div>
      <div>
        <div
          className={[
            "text-sm font-semibold leading-tight",
            isHighlight ? "text-white" : isActive ? "text-foreground" : "",
          ].join(" ")}
        >
          {label}
        </div>
        <div
          className={[
            "text-[11px] leading-tight mt-0.5",
            isHighlight ? "text-white/70" : "text-muted-foreground/70",
          ].join(" ")}
        >
          {desc}
        </div>
      </div>
    </button>
  );
}
