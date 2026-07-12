export type NotifType = "low_stock" | "warranty" | "missing_info" | "summary" | "reminder";
export type NotifTab = "all" | "unread" | "reminders";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  actionLabel?: string;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "low_stock",
    title: "Low stock: AA Batteries",
    description: "Only 2 batteries left in Utility Room.",
    timestamp: "10 min ago",
    unread: true,
    actionLabel: "View Item",
  },
  {
    id: "n2",
    type: "warranty",
    title: "Warranty expiring soon",
    description: "Sony WH-1000XM5 Headphones warranty expires in 14 days.",
    timestamp: "2 hours ago",
    unread: true,
    actionLabel: "View Item",
  },
  {
    id: "n3",
    type: "missing_info",
    title: "Missing item info",
    description: "Tool Kit is missing purchase date and estimated value.",
    timestamp: "Yesterday",
    unread: true,
    actionLabel: "Fix Now",
  },
  {
    id: "n4",
    type: "summary",
    title: "Monthly summary ready",
    description: "Your June inventory report is available to view.",
    timestamp: "2 days ago",
    unread: false,
    actionLabel: "View Report",
  },
  {
    id: "n5",
    type: "reminder",
    title: "Wishlist reminder",
    description: "Storage Bins are still marked high priority on your wishlist.",
    timestamp: "3 days ago",
    unread: false,
    actionLabel: "View Wishlist",
  },
];
