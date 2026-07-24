import { Package, ShieldAlert, AlertCircle, BarChart2, ShoppingCart } from "lucide-react";
import type { Notification, NotifType } from "../data/mockNotifications";

const TYPE_META: Record<
  NotifType,
  { Icon: React.ComponentType<{ size?: number; className?: string }>; iconBg: string; iconColor: string }
> = {
  low_stock: { Icon: Package, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  warranty: { Icon: ShieldAlert, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  missing_info: { Icon: AlertCircle, iconBg: "bg-red-100", iconColor: "text-red-600" },
  summary: { Icon: BarChart2, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  reminder: { Icon: ShoppingCart, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onAction?: (notif: Notification) => void;
}

export default function NotificationItem({ notification: n, onRead, onAction }: NotificationItemProps) {
  const meta = TYPE_META[n.type];

  return (
    <div
      onClick={() => onRead(n.id)}
      className={[
        "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/50 relative",
        n.unread ? "bg-accent/[0.03]" : "",
      ].join(" ")}
    >
      {/* Unread dot */}
      {n.unread && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
      )}

      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.iconBg}`}
      >
        <meta.Icon size={15} className={meta.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            "text-sm leading-snug",
            n.unread ? "font-semibold text-foreground" : "font-medium text-foreground/80",
          ].join(" ")}
        >
          {n.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {n.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground/70">{n.timestamp}</span>
          {n.actionLabel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.(n);
              }}
              className="text-[10px] font-bold text-accent hover:text-accent/80 transition-colors"
            >
              {n.actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
