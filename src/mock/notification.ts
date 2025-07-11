// mock/notifications.ts

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Booking Confirmed",
    message:
      "Your meeting room booking for tomorrow at 2:00 PM has been confirmed.",
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    read: false,
  },
  {
    id: "2",
    type: "info",
    title: "New Space Available",
    message: "A premium office space just became available on the 5th floor.",
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Booking Reminder",
    message: "Your booking starts in 30 minutes. Conference Room A, 3rd Floor.",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    read: false,
  },
  {
    id: "4",
    type: "error",
    title: "Payment Failed",
    message:
      "Your payment for the workspace booking could not be processed. Please update your payment method.",
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "Space Maintenance",
    message:
      "Conference Room B will be under maintenance tomorrow from 9 AM to 11 AM.",
    timestamp: new Date(Date.now() - 14400000), // 4 hours ago
    read: true,
  },
  {
    id: "6",
    type: "success",
    title: "Profile Updated",
    message: "Your profile information has been successfully updated.",
    timestamp: new Date(Date.now() - 21600000), // 6 hours ago
    read: true,
  },
  {
    id: "7",
    type: "warning",
    title: "Booking Expires Soon",
    message:
      "Your booking for Hot Desk #5 expires in 2 hours. Extend or check out now.",
    timestamp: new Date(Date.now() - 43200000), // 12 hours ago
    read: true,
  },
  {
    id: "8",
    type: "info",
    title: "New Feature Available",
    message:
      "Check out our new real-time space availability feature in the spaces section.",
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    read: true,
  },
  {
    id: "9",
    type: "success",
    title: "Booking Completed",
    message:
      "Thank you for using Meeting Room C. We hope you had a productive session!",
    timestamp: new Date(Date.now() - 172800000), // 2 days ago
    read: true,
  },
  {
    id: "10",
    type: "info",
    title: "Welcome to CoHub",
    message:
      "Welcome to our co-working platform! Explore available spaces and make your first booking.",
    timestamp: new Date(Date.now() - 259200000), // 3 days ago
    read: true,
  },
];
