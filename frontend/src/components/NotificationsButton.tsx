import { useEffect, useRef, useState } from "react";
import { Bell, Settings, X } from "lucide-react";
import type { NotifTab } from "../data/mockNotifications";
import NotificationItem from "./NotificationItem";
import { useNotifications } from "../context/NotificationsContext";
import type { PageName } from "../types";

interface NotificationsButtonProps {
  onNavigate?: (page: PageName, query?: string) => void;
}

export default function NotificationsButton({ onNavigate }: NotificationsButtonProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotifTab>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.addEventListener("pointerdown", onPointerDown);
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const TAB_LABELS: { id: NotifTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "reminders", label: "Reminders" },
  ];

  const visible = notifications.filter((n) => {
    if (tab === "unread") return n.unread;
    if (tab === "reminders") return n.type === "reminder" || n.type === "warranty";
    return true;
  });

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
        style={{ color: open ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(255,255,255,0.9)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = open ? "rgba(255,255,255,0.08)" : "transparent";
          e.currentTarget.style.color = open ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)";
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: "#7B9FFF", padding: "0 3px", lineHeight: 1 }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] w-[390px] bg-card border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Notifications</h2>
              {unreadCount > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors px-2 py-1 rounded-lg hover:bg-accent/10"
                >
                  Mark all read
                </button>
              )}
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Settings size={13} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-1">
            {TAB_LABELS.map((t) => {
              const count =
                t.id === "unread"
                  ? unreadCount
                  : t.id === "reminders"
                    ? notifications.filter((n) => n.type === "reminder" || n.type === "warranty").length
                    : notifications.length;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={[
                    "flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold transition-colors",
                    tab === t.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {t.label}
                  {count > 0 && tab !== t.id && (
                    <span className="text-[9px] font-bold opacity-60">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-border/50">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Bell size={16} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground mt-1">No notifications in this category.</p>
              </div>
            ) : (
              visible.map((n) => <NotificationItem key={n.id} notification={n} onRead={markRead} />)
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-3">
            <button
              onClick={() => {
                setOpen(false);
                onNavigate?.("notifications");
              }}
              className="w-full text-center text-xs font-semibold text-accent hover:text-accent/80 transition-colors py-1 rounded-lg hover:bg-accent/5"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
