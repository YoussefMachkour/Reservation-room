// types/notifications.ts

export interface Notification {
  id: string;
  type: "booking" | "payment" | "membership" | "system" | "cancellation";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  memberName?: string;
  memberAvatar?: string;
  priority: "high" | "medium" | "low";
  actionRequired?: boolean;
}

// data/mockNotifications.ts

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "booking",
    title: "New Booking Request",
    message: "Meeting Room A requested for tomorrow 2:00 PM - 4:00 PM",
    timestamp: "2 minutes ago",
    isRead: false,
    memberName: "Sarah Johnson",
    memberAvatar: "SJ",
    priority: "high",
    actionRequired: true,
  },
  {
    id: "2",
    type: "payment",
    title: "Payment Received",
    message: "Monthly membership fee payment of $150 received",
    timestamp: "15 minutes ago",
    isRead: false,
    memberName: "John Smith",
    memberAvatar: "JS",
    priority: "medium",
  },
  {
    id: "3",
    type: "membership",
    title: "Membership Expiring Soon",
    message: "Premium membership expires in 3 days",
    timestamp: "1 hour ago",
    isRead: false,
    memberName: "Mike Chen",
    memberAvatar: "MC",
    priority: "high",
    actionRequired: true,
  },
  {
    id: "4",
    type: "cancellation",
    title: "Booking Cancelled",
    message: "Conference Room B booking cancelled for today 3:00 PM",
    timestamp: "2 hours ago",
    isRead: true,
    memberName: "Emma Wilson",
    memberAvatar: "EW",
    priority: "medium",
  },
  {
    id: "5",
    type: "system",
    title: "Maintenance Alert",
    message: "Meeting Room C air conditioning scheduled for maintenance",
    timestamp: "3 hours ago",
    isRead: false,
    priority: "medium",
  },
  {
    id: "6",
    type: "membership",
    title: "New Member Registration",
    message: "New member registration pending approval",
    timestamp: "4 hours ago",
    isRead: true,
    memberName: "David Brown",
    memberAvatar: "DB",
    priority: "low",
    actionRequired: true,
  },
  {
    id: "7",
    type: "payment",
    title: "Payment Failed",
    message: "Monthly payment failed for Premium membership",
    timestamp: "5 hours ago",
    isRead: false,
    memberName: "Lisa Garcia",
    memberAvatar: "LG",
    priority: "high",
    actionRequired: true,
  },
  {
    id: "8",
    type: "booking",
    title: "Hot Desk Booked",
    message: "Hot desk #12 booked for full day tomorrow",
    timestamp: "6 hours ago",
    isRead: true,
    memberName: "Alex Rodriguez",
    memberAvatar: "AR",
    priority: "low",
  },
  {
    id: "9",
    type: "system",
    title: "Wi-Fi Maintenance",
    message: "Scheduled Wi-Fi maintenance tonight 11:00 PM - 1:00 AM",
    timestamp: "8 hours ago",
    isRead: false,
    priority: "medium",
  },
  {
    id: "10",
    type: "membership",
    title: "Membership Upgraded",
    message: "Basic membership upgraded to Premium",
    timestamp: "1 day ago",
    isRead: true,
    memberName: "Jessica Kim",
    memberAvatar: "JK",
    priority: "low",
  },
];
