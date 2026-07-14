import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home, Plus, ChevronRight, Settings2, Eye, Package,
  Pencil, TrendingUp, AlertCircle, Layers, Bed,
  Coffee, Car, Shirt, Wrench, Box, Sofa, Archive, Trash2,
} from "lucide-react";
import { TopNav, NavStrip } from "../components/TopNav";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";
import { createRoom, deleteRoom, getRooms } from "../services/api";
import { queryKeys } from "../queries/keys";

/* ── Room data ───────────────────────────────────────────────────── */

interface Room {
  id: string;
  name: string;
	description: string;
  items: number;
  value: number;
  recentItem: string;
  missingInfo: boolean;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
}

const ROOM_STYLES = [
  { id: "bedroom", name: "Bedroom", items: 38, value: 2840, recentItem: "Sony WH-1000XM5 Headphones", missingInfo: false, Icon: Bed, iconBg: "bg-pink-50", iconColor: "text-pink-600" },
  { id: "office", name: "Office", items: 34, value: 4120, recentItem: "USB-C 8-in-1 Hub", missingInfo: false, Icon: Layers, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { id: "garage", name: "Garage", items: 41, value: 1960, recentItem: "Power Drill — DeWalt 20V", missingInfo: true, Icon: Car, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { id: "kitchen", name: "Kitchen", items: 45, value: 2380, recentItem: "Ninja Air Fryer 5.5qt", missingInfo: false, Icon: Coffee, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { id: "living", name: "Living Room", items: 52, value: 5200, recentItem: "Bookshelf Speakers (Pair)", missingInfo: false, Icon: Sofa, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
  { id: "closet", name: "Closet", items: 12, value: 890, recentItem: "Winter Jacket — North Face", missingInfo: true, Icon: Shirt, iconBg: "bg-fuchsia-50", iconColor: "text-fuchsia-600" },
  { id: "utility", name: "Utility Room", items: 18, value: 420, recentItem: "AA Batteries (Bulk Pack)", missingInfo: false, Icon: Wrench, iconBg: "bg-slate-50", iconColor: "text-slate-600" },
  { id: "hall", name: "Hall Closet", items: 8, value: 610, recentItem: "Vacuum Cleaner — Dyson V11", missingInfo: false, Icon: Archive, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
];

/* ── Component ───────────────────────────────────────────────────── */

export interface RoomsPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function RoomsPage({ onSignOut, onNavigate, onSettings }: RoomsPageProps) {
	const queryClient = useQueryClient();
	const roomsQuery = useQuery({ queryKey: queryKeys.rooms, queryFn: getRooms });
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
	const [roomName, setRoomName] = useState("");
	const [roomDescription, setRoomDescription] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
	const [deleting, setDeleting] = useState(false);

	const rooms = (roomsQuery.data ?? []).map((room, index): Room => ({
			...ROOM_STYLES[index % ROOM_STYLES.length],
			id: room.id, name: room.name, description: room.description,
			items: room.itemCount, value: room.estimatedValue,
			recentItem: room.recentItem || "No items yet", missingInfo: room.missingInfo,
		}));

	const handleCreateRoom = async () => {
		if (!roomName.trim()) { setError("Room name is required."); return; }
		setSaving(true); setError(null);
		try {
			await createRoom(roomName.trim(), roomDescription.trim());
			setRoomName(""); setRoomDescription(""); setShowAddRoom(false);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.rooms }),
				queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
			]);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Unable to create room.");
		} finally { setSaving(false); }
	};

	const handleDeleteRoom = async () => {
		if (!deleteTarget) return;
		setDeleting(true); setError(null);
		try {
			await deleteRoom(deleteTarget.id);
			setSelectedRoom(null); setDeleteTarget(null);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.rooms }),
				queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
				queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
				queryClient.invalidateQueries({ queryKey: queryKeys.items }),
			]);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Unable to delete room.");
		} finally { setDeleting(false); }
	};

  const totalItems = rooms.reduce((s, r) => s + r.items, 0);
  const totalValue = rooms.reduce((s, r) => s + r.value, 0);
  const mostUsed = rooms.reduce<Room | null>((top, room) => !top || room.items > top.items ? room : top, null);
  const roomsWithIssues = rooms.filter((r) => r.missingInfo).length;

  const detail = selectedRoom ? rooms.find((r) => r.id === selectedRoom) : null;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID["rooms"] ?? "rooms"}
          onSelect={(id) => { const p = NAV_ID_TO_PAGE[id]; if (p) onNavigate(p); }}
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Rooms</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight" style={{ letterSpacing: "-0.03em", fontFamily: "'Instrument Serif', serif" }}>
              Rooms
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Organize your inventory by location.</p>
          </div>
          <button
            onClick={() => setShowAddRoom(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm"
          >
            <Plus size={14} />Add Room
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Rooms", value: String(rooms.length), sub: "All active", Icon: Home, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
            { label: "Most Items", value: mostUsed?.name ?? "—", sub: mostUsed ? `${mostUsed.items} items` : "No data", Icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
            { label: "Rooms with Issues", value: String(roomsWithIssues), sub: "Missing info", Icon: AlertCircle, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
            { label: "Total Items", value: String(totalItems), sub: `$${totalValue.toLocaleString()} value`, Icon: Package, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.Icon size={16} className={s.iconColor} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-0.5" style={{ letterSpacing: "-0.03em" }}>{s.value}</div>
              <div className="text-xs font-semibold text-foreground/80">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main layout */}
        <div className={["grid gap-6", detail ? "grid-cols-[1fr_320px]" : "grid-cols-1"].join(" ")}>

          {/* Room cards grid */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4 content-start">
            {rooms.map((room) => {
              const isSelected = selectedRoom === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                  className={[
                    "bg-card rounded-2xl border p-5 shadow-sm cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group",
                    isSelected ? "border-accent ring-2 ring-accent/20 shadow-md" : "border-border",
                  ].join(" ")}
                >
                  {/* Icon + badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${room.iconBg}`}>
                      <room.Icon size={20} className={room.iconColor} />
                    </div>
                    {room.missingInfo && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">INFO</span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-bold text-foreground mb-3">{room.name}</h3>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Items</p>
                      <p className="text-sm font-bold text-foreground">{room.items}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Value</p>
                      <p className="text-sm font-bold text-foreground">${room.value.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Recent item */}
                  <div className="mb-4 px-3 py-2 rounded-lg bg-muted/60">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Recent</p>
                    <p className="text-xs text-foreground font-semibold leading-snug line-clamp-1">{room.recentItem}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate("allItems"); }}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-accent text-accent-foreground text-[11px] font-semibold hover:bg-accent/90 transition-colors"
                    >
                      <Eye size={10} />View Items
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil size={10} />Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {detail && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Panel header */}
                <div className={`h-24 flex items-center justify-center ${detail.iconBg}`}>
                  <detail.Icon size={40} className={detail.iconColor} />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-bold text-foreground">{detail.name}</h2>
                    <button onClick={() => setSelectedRoom(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{detail.items} items · ${detail.value.toLocaleString()} est. value</p>

                  <div className="space-y-2 mb-5">
                    {[
                      { label: "Item Count", value: String(detail.items) },
                      { label: "Estimated Value", value: `$${detail.value.toLocaleString()}` },
                      { label: "Status", value: detail.missingInfo ? "Needs attention" : "Up to date" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className="text-xs font-semibold text-foreground">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => onNavigate("allItems")}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
                    >
                      <Eye size={14} />View All Items
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                      <Pencil size={13} />Edit Room
                    </button>
					<button onClick={() => setDeleteTarget(detail)} className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
					  <Trash2 size={13} />Delete Room
					</button>
                  </div>
                </div>
              </div>

              {/* Recent item */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3" style={{ letterSpacing: "0.08em" }}>Most Recent Item</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${detail.iconBg}`}>
                    <Package size={14} className={detail.iconColor} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{detail.recentItem}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{detail.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Room modal hint */}
        {(error || roomsQuery.error) && <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error ?? (roomsQuery.error instanceof Error ? roomsQuery.error.message : "Unable to load rooms.")}</div>}
		{deleteTarget && (
		  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)}>
			<div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
			  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><Trash2 size={18} /></div>
			  <h2 className="text-base font-bold text-foreground">Delete “{deleteTarget.name}”?</h2>
			  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This room will be removed from your account. Items currently assigned to it will not be deleted; their room will be cleared and shown as unassigned.</p>
			  <div className="mt-5 flex gap-2">
				<button onClick={handleDeleteRoom} disabled={deleting} className="flex-1 h-9 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{deleting ? "Deleting…" : "Delete Room"}</button>
				<button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 h-9 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
			  </div>
			</div>
		  </div>
		)}
        {showAddRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAddRoom(false)}>
            <div className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-base font-bold text-foreground mb-4">Add New Room</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Room Name</label>
                  <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="e.g. Guest Bedroom" className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description (optional)</label>
                  <input value={roomDescription} onChange={(event) => setRoomDescription(event.target.value)} placeholder="A short note about this space" className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={handleCreateRoom} disabled={saving} className="flex-1 h-9 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60">{saving ? "Saving…" : "Save Room"}</button>
                <button onClick={() => setShowAddRoom(false)} className="flex-1 h-9 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="h-6" />
      </main>
    </div>
  );
}
