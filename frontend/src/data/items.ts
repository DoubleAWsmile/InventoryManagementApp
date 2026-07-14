import {
  Headphones, Wrench, Plug, Shirt, Shield, Battery, Box, Package,
  Zap, Dumbbell, Coffee, Hammer, Home, Heart,
} from "lucide-react";
import type { Item } from "../types";
import type { ApiItem } from "../services/api";

export const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "bg-blue-50 text-blue-700 border-blue-200",
  Tools: "bg-amber-50 text-amber-700 border-amber-200",
  Clothing: "bg-pink-50 text-pink-700 border-pink-200",
  Cables: "bg-purple-50 text-purple-700 border-purple-200",
  Safety: "bg-red-50 text-red-700 border-red-200",
  Household: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Fitness: "bg-teal-50 text-teal-700 border-teal-200",
  Appliances: "bg-orange-50 text-orange-700 border-orange-200",
  Outdoor: "bg-green-50 text-green-700 border-green-200",
  Kitchenware: "bg-rose-50 text-rose-700 border-rose-200",
  Bedroom: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

export const TAG_COLORS = [
  "bg-slate-100 text-slate-600",
  "bg-blue-100/60 text-blue-600",
  "bg-violet-100/60 text-violet-600",
];

export const PAGE_SIZE = 12;

const CATEGORY_ICONS = {
  Electronics: Headphones,
  Tools: Wrench,
  Clothing: Shirt,
  Cables: Plug,
  Safety: Shield,
  Household: Battery,
  Fitness: Dumbbell,
  Appliances: Coffee,
  Outdoor: Home,
} as const;

const CATEGORY_ICON_STYLES: Record<string, { iconBg: string; iconColor: string }> = {
  Electronics: { iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  Tools: { iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  Clothing: { iconBg: "bg-pink-50", iconColor: "text-pink-600" },
  Cables: { iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  Safety: { iconBg: "bg-red-50", iconColor: "text-red-500" },
  Household: { iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
  Fitness: { iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  Appliances: { iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  Outdoor: { iconBg: "bg-green-50", iconColor: "text-green-600" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function toDisplayItem(item: ApiItem): Item {
  const style = CATEGORY_ICON_STYLES[item.category] ?? {
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
  };

  return {
    id: item.id,
    name: item.name,
    category: item.category,
    room: item.roomLocation,
    qty: item.quantity,
    value: item.estimatedValue ?? 0,
    addedDate: formatDate(item.createdAt),
    updatedDate: formatDate(item.updatedAt),
    tags: item.tags ?? [],
    missingInfo: item.estimatedValue == null || !item.condition || !item.brand,
    lowStock: item.quantity <= 2,
    Icon: CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] ?? Package,
    purchaseDate: item.purchaseDate ? formatDate(item.purchaseDate) : undefined,
    condition: item.condition,
    brand: item.brand,
    model: item.model,
    serialNumber: item.serialNumber,
    description: item.description,
    notes: item.notes,
    photoUrl: item.photoUrl,
    photoFilename: item.photoFilename,
    photoMimeType: item.photoMimeType,
    photoSizeBytes: item.photoSizeBytes,
    ...style,
  };
}

export const ALL_ITEMS: Item[] = [
  { id: 1, name: "Sony WH-1000XM5 Headphones", category: "Electronics", room: "Bedroom", qty: 1, value: 279, addedDate: "Jun 2, 2024", updatedDate: "Jun 2, 2024", tags: ["Audio", "Wireless"], missingInfo: false, lowStock: false, Icon: Headphones, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { id: 2, name: "Tool Kit (20-Piece Set)", category: "Tools", room: "Garage", qty: 1, value: 45, addedDate: "May 18, 2024", updatedDate: "May 20, 2024", tags: ["Hand Tools"], missingInfo: false, lowStock: false, Icon: Wrench, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { id: 3, name: "HDMI 2.1 Cable 6ft", category: "Cables", room: "Office", qty: 3, value: 18, addedDate: "Apr 27, 2024", updatedDate: "Apr 27, 2024", tags: ["Cable", "4K"], missingInfo: false, lowStock: false, Icon: Plug, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  { id: 4, name: "Winter Jacket — North Face", category: "Clothing", room: "Closet", qty: 1, value: 120, addedDate: "Jan 12, 2024", updatedDate: "Feb 1, 2024", tags: ["Outerwear", "Winter"], missingInfo: false, lowStock: false, Icon: Shirt, iconBg: "bg-pink-50", iconColor: "text-pink-600" },
  { id: 5, name: "First Aid Kit (Deluxe)", category: "Safety", room: "Hall Closet", qty: 1, value: 32, addedDate: "Mar 3, 2024", updatedDate: "Mar 3, 2024", tags: ["Emergency", "Medical"], missingInfo: false, lowStock: false, Icon: Shield, iconBg: "bg-red-50", iconColor: "text-red-500" },
  { id: 6, name: "AA Batteries (Bulk Pack)", category: "Household", room: "Utility Room", qty: 12, value: 14, addedDate: "Jun 8, 2024", updatedDate: "Jun 8, 2024", tags: ["Batteries", "Bulk"], missingInfo: false, lowStock: false, Icon: Battery, iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
  { id: 7, name: "USB-C 8-in-1 Hub", category: "Electronics", room: "Office", qty: 2, value: 49, addedDate: "Jun 1, 2024", updatedDate: "Jun 1, 2024", tags: ["Accessories", "USB"], missingInfo: false, lowStock: false, Icon: Box, iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
  { id: 8, name: "Ninja Air Fryer 5.5qt", category: "Appliances", room: "Kitchen", qty: 1, value: 99, addedDate: "Dec 10, 2023", updatedDate: "Dec 12, 2023", tags: ["Kitchen", "Cooking"], missingInfo: false, lowStock: false, Icon: Package, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { id: 9, name: "Power Drill — DeWalt 20V", category: "Tools", room: "Garage", qty: 1, value: 95, addedDate: "Feb 28, 2024", updatedDate: "Mar 5, 2024", tags: ["Power Tools", "Drill"], missingInfo: false, lowStock: false, Icon: Zap, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { id: 10, name: "Yoga Mat (6mm)", category: "Fitness", room: "Bedroom", qty: 1, value: 35, addedDate: "Apr 5, 2024", updatedDate: "Apr 5, 2024", tags: ["Exercise", "Wellness"], missingInfo: false, lowStock: false, Icon: Dumbbell, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  { id: 11, name: "Nespresso Vertuo Coffee Machine", category: "Appliances", room: "Kitchen", qty: 1, value: 189, addedDate: "Nov 20, 2023", updatedDate: "Nov 22, 2023", tags: ["Coffee", "Kitchen"], missingInfo: false, lowStock: false, Icon: Coffee, iconBg: "bg-orange-50", iconColor: "text-orange-700" },
  { id: 12, name: "Hammer — 16oz Claw", category: "Tools", room: "Garage", qty: 1, value: 28, addedDate: "Mar 10, 2024", updatedDate: "Mar 10, 2024", tags: ["Hand Tools"], missingInfo: true, lowStock: false, Icon: Hammer, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { id: 13, name: "Extension Cord 25ft", category: "Household", room: "Utility Room", qty: 3, value: 22, addedDate: "May 10, 2024", updatedDate: "May 10, 2024", tags: ["Electrical", "Household"], missingInfo: false, lowStock: false, Icon: Plug, iconBg: "bg-slate-50", iconColor: "text-slate-600" },
  { id: 14, name: "Camping Tent — 4-Person", category: "Outdoor", room: "Garage", qty: 1, value: 180, addedDate: "Feb 14, 2024", updatedDate: "Feb 14, 2024", tags: ["Camping", "Outdoor"], missingInfo: false, lowStock: false, Icon: Home, iconBg: "bg-green-50", iconColor: "text-green-600" },
  { id: 15, name: "Kitchen Knife Set (7-piece)", category: "Kitchenware", room: "Kitchen", qty: 1, value: 89, addedDate: "Mar 21, 2024", updatedDate: "Mar 21, 2024", tags: ["Knives", "Cooking"], missingInfo: false, lowStock: false, Icon: Package, iconBg: "bg-red-50", iconColor: "text-red-600" },
  { id: 16, name: "MacBook Pro Laptop Stand", category: "Electronics", room: "Office", qty: 1, value: 55, addedDate: "May 29, 2024", updatedDate: "May 29, 2024", tags: ["Desk", "Laptop"], missingInfo: false, lowStock: false, Icon: Box, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { id: 17, name: "Throw Blanket — Chunky Knit", category: "Bedroom", room: "Bedroom", qty: 2, value: 45, addedDate: "Nov 15, 2023", updatedDate: "Nov 15, 2023", tags: ["Decor", "Bedroom"], missingInfo: true, lowStock: false, Icon: Heart, iconBg: "bg-pink-50", iconColor: "text-pink-500" },
  { id: 18, name: "Bookshelf Speakers (Pair)", category: "Electronics", room: "Living Room", qty: 2, value: 159, addedDate: "Apr 18, 2024", updatedDate: "Apr 20, 2024", tags: ["Audio", "Speakers"], missingInfo: false, lowStock: false, Icon: Headphones, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { id: 19, name: "Vacuum Cleaner — Dyson V11", category: "Appliances", room: "Hall Closet", qty: 1, value: 249, addedDate: "Dec 3, 2023", updatedDate: "Jan 4, 2024", tags: ["Cleaning", "Cordless"], missingInfo: false, lowStock: false, Icon: Package, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
  { id: 20, name: "AAA Batteries (12-pack)", category: "Household", room: "Utility Room", qty: 2, value: 10, addedDate: "Jun 5, 2024", updatedDate: "Jun 5, 2024", tags: ["Batteries"], missingInfo: false, lowStock: true, Icon: Battery, iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
  { id: 21, name: "Dumbbell Set (10–50 lbs)", category: "Fitness", room: "Bedroom", qty: 1, value: 220, addedDate: "Jan 8, 2024", updatedDate: "Jan 8, 2024", tags: ["Weights", "Fitness"], missingInfo: false, lowStock: false, Icon: Dumbbell, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  { id: 22, name: "Safety Goggles (Anti-fog)", category: "Safety", room: "Garage", qty: 3, value: 15, addedDate: "Apr 1, 2024", updatedDate: "Apr 1, 2024", tags: ["PPE", "Garage"], missingInfo: false, lowStock: false, Icon: Shield, iconBg: "bg-red-50", iconColor: "text-red-500" },
];
