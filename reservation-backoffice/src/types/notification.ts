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
