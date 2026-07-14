import type { ComponentType } from "react";

export type PageName =
  | "dashboard"
  | "allItems"
  | "itemDetail"
  | "settings"
  | "rooms"
  | "categories"
  | "addItem"
  | "wishlist"
  | "reports"
  | "map"
  | "searchResults"
  | "notifications";

export interface IconProps {
  size?: number;
  className?: string;
}

export type IconComponent = ComponentType<IconProps>;

export interface Item {
  id: string | number;
  name: string;
  category: string;
  room: string;
  qty: number;
  value: number;
  addedDate: string;
  updatedDate: string;
  tags: string[];
  missingInfo: boolean;
  lowStock: boolean;
  Icon: IconComponent;
  iconBg: string;
  iconColor: string;
  purchaseDate?: string;
  condition?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  notes?: string;
  photoUrl?: string;
  photoFilename?: string;
  photoMimeType?: string;
  photoSizeBytes?: number;
}

export interface NavItem {
  id: string;
  label: string;
  desc: string;
  Icon: IconComponent;
  highlight?: boolean;
}
