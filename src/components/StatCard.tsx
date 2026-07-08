import { MoreHorizontal } from "lucide-react";
import type { IconComponent } from "../types";

export interface StatCardProps {
  label: string;
  value: string;
  Icon: IconComponent;
  sub: string;
  iconBg: string;
  iconColor: string;
  trend: "up" | "neutral" | "warn";
}

export default function StatCard({
  label,
  value,
  Icon,
  sub,
  iconBg,
  iconColor,
  trend,
}: StatCardProps) {
  const subColor =
    trend === "warn"
      ? "text-amber-500"
      : trend === "up"
      ? "text-emerald-600"
      : "text-muted-foreground";

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
        <MoreHorizontal
          size={14}
          className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors cursor-pointer"
        />
      </div>
      <div
        className="text-2xl font-bold text-foreground mb-1"
        style={{ letterSpacing: "-0.03em" }}
      >
        {value}
      </div>
      <div className="text-xs font-semibold text-foreground/80 mb-1">{label}</div>
      <div className={`text-[11px] font-medium ${subColor}`}>{sub}</div>
    </div>
  );
}
