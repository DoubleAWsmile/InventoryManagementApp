import {
  ChevronRight,
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Package,
  ShieldAlert,
  AlertCircle,
  BarChart2,
  ShoppingCart,
} from "lucide-react";
import { TopNav, NavStrip } from "../components/TopNav";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";
import { useNotifications } from "../context/NotificationsContext";
import type { Notification, NotifType } from "../data/mockNotifications";
import { useState } from "react";

/* ── Tab definitions ─────────────────────────────────────────────── */

type TabId =
  "all" | "unread" | "reminders" | "low_stock" | "warranty" | "missing_info" | "summary" | "reminder";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "reminders", label: "Reminders" },
  { id: "low_stock", label: "Low Stock" },
  { id: "warranty", label: "Warranty" },
  { id: "missing_info", label: "Missing Info" },
  { id: "summary", label: "Reports" },
];

/* ── Type metadata ───────────────────────────────────────────────── */

const TYPE_META: Record<
  NotifType,
  {
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    iconBg: string;
    iconColor: string;
    label: string;
  }
> = {
  low_stock: { Icon: Package, iconBg: "bg-amber-100", iconColor: "text-amber-600", label: "Low Stock" },
  warranty: { Icon: ShieldAlert, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Warranty" },
  missing_info: { Icon: AlertCircle, iconBg: "bg-red-100", iconColor: "text-red-600", label: "Missing Info" },
  summary: { Icon: BarChart2, iconBg: "bg-violet-100", iconColor: "text-violet-600", label: "Report" },
  reminder: {
    Icon: ShoppingCart,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    label: "Reminder",
  },
};

/* ── Filter logic ────────────────────────────────────────────────── */

function filterByTab(notifications: Notification[], tab: TabId): Notification[] {
  switch (tab) {
    case "unread":
      return notifications.filter((n) => n.unread);
    case "reminders":
      return notifications.filter((n) => n.type === "reminder" || n.type === "warranty");
    case "all":
      return notifications;
    default:
      return notifications.filter((n) => n.type === tab);
  }
}

/* ── Component ───────────────────────────────────────────────────── */

export interface NotificationsPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName, query?: string) => void;
  onSettings?: () => void;
}

export default function NotificationsPage({ onSignOut, onNavigate, onSettings }: NotificationsPageProps) {
  const { notifications, unreadCount, markRead, markAllRead, clearRead } = useNotifications();
  const [tab, setTab] = useState<TabId>("all");

  const visible = filterByTab(notifications, tab);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID["dashboard"] ?? ""}
          onSelect={(id) => {
            const p = NAV_ID_TO_PAGE[id];
            if (p) onNavigate(p);
          }}
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">
            Dashboard
          </button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Notifications</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="font-display text-[26px] text-foreground leading-tight"
              style={{ letterSpacing: "-0.03em" }}
            >
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0 ? (
                <>
                  <span className="font-semibold text-foreground">{unreadCount}</span> unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </>
              ) : (
                "All caught up"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button
              onClick={clearRead}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Trash2 size={13} />
              Clear read
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-b border-border pb-0">
          {TABS.map((t) => {
            const count = filterByTab(notifications, t.id).length;
            const unread = filterByTab(notifications, t.id).filter((n) => n.unread).length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "relative flex items-center gap-1.5 h-9 px-3.5 text-sm font-semibold transition-colors rounded-t-lg border-b-2 -mb-px flex-shrink-0",
                  tab === t.id
                    ? "text-foreground border-accent"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
                ].join(" ")}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className={[
                      "h-5 min-w-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                      tab === t.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {unread > 0 ? unread : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Bell size={24} className="text-muted-foreground" />
            </div>
            <h2 className="text-base font-bold text-foreground mb-1">
              {tab === "unread" ? "All caught up!" : "No notifications"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tab === "unread" ? "No unread notifications right now." : "Nothing to show in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Group by date */}
            <NotifGroup title="Recent" notifications={visible.slice(0, 3)} onRead={markRead} />
            {visible.length > 3 && (
              <NotifGroup title="Earlier" notifications={visible.slice(3)} onRead={markRead} />
            )}
          </div>
        )}

        <div className="h-8" />
      </main>
      <style>{`.scrollbar-hide{scrollbar-width:none;-ms-overflow-style:none}.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

/* ── Notification group ──────────────────────────────────────────── */

function NotifGroup({
  title,
  notifications,
  onRead,
}: {
  title: string;
  notifications: Notification[];
  onRead: (id: string) => void;
}) {
  if (notifications.length === 0) return null;
  return (
    <div>
      <p
        className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 pl-1"
        style={{ letterSpacing: "0.08em" }}
      >
        {title}
      </p>
      <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border/50 overflow-hidden">
        {notifications.map((n) => (
          <FullNotifRow key={n.id} notification={n} onRead={onRead} />
        ))}
      </div>
    </div>
  );
}

/* ── Full notification row ───────────────────────────────────────── */

function FullNotifRow({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const meta = TYPE_META[n.type];

  return (
    <div
      onClick={() => onRead(n.id)}
      className={[
        "flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-muted/40 relative",
        n.unread ? "bg-accent/[0.025]" : "",
      ].join(" ")}
    >
      {/* Unread indicator */}
      {n.unread && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent rounded-l-2xl" />}

      {/* Type icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.iconBg}`}
      >
        <meta.Icon size={18} className={meta.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={[
                  "text-sm leading-snug",
                  n.unread ? "font-bold text-foreground" : "font-medium text-foreground/80",
                ].join(" ")}
              >
                {n.title}
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.iconBg} ${meta.iconColor}`}
              >
                {meta.label}
              </span>
              {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{n.timestamp}</span>
            {!n.unread && <span className="text-[10px] text-muted-foreground/50 font-medium">Read</span>}
          </div>
        </div>
        {n.actionLabel && (
          <button
            onClick={(e) => e.stopPropagation()}
            className="mt-2.5 flex items-center gap-1.5 h-7 px-3 rounded-lg bg-accent text-accent-foreground text-[11px] font-bold hover:bg-accent/90 transition-colors"
          >
            {n.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
