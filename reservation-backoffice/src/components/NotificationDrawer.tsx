// components/NotificationDrawer.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Calendar,
  DollarSign,
  UserPlus,
  XCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import type { Notification } from "../mock/notifications";

interface NotificationDrawerProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

export function NotificationDrawer({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}: NotificationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return Calendar;
      case "payment":
        return DollarSign;
      case "membership":
        return UserPlus;
      case "cancellation":
        return XCircle;
      case "system":
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "text-red-500";
    if (priority === "medium") return "text-yellow-500";
    return "text-blue-500";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-80 p-0 m-4 mr-6 h-[calc(100vh-2rem)] rounded-xl shadow-2xl border-2 bg-background/90 backdrop-blur-xl"
      >
        <div className="flex h-full flex-col rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs h-7 px-2"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            <div className="p-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-muted/50 mb-3">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No notifications
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`relative p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer group ${
                          !notification.isRead
                            ? "bg-blue-50/80 border-blue-200/60 hover:bg-blue-50"
                            : "bg-background/50 border-border/50 hover:bg-muted/30"
                        }`}
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              !notification.isRead
                                ? "bg-blue-100/80"
                                : "bg-muted/60"
                            }`}
                          >
                            <Icon
                              className={`h-3.5 w-3.5 ${getNotificationColor(
                                notification.type,
                                notification.priority
                              )}`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className="text-sm font-medium truncate pr-2">
                                {notification.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-1">
                                {notification.memberName && (
                                  <>
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className="text-xs bg-muted">
                                        {notification.memberAvatar}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                      {notification.memberName}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                {notification.actionRequired && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs h-4 px-1"
                                  >
                                    Action
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {notification.timestamp}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!notification.isRead && (
                          <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-3 bg-background/95 backdrop-blur-sm">
              <Button variant="outline" className="w-full text-xs h-8">
                View All Notifications
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
