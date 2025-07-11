// components/notifications/NotificationDrawer.tsx
import React from "react";
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { Notification } from "../../mock/notification";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
}) => {
  const { isDark } = useTheme();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop for click outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Floating Notification Panel */}
      <div
        className={`fixed top-16 right-4 w-96 max-h-[600px] transform transition-all duration-300 ease-out z-50 ${
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-95"
        } ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border rounded-lg shadow-2xl`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          } rounded-t-lg`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell
                className={`w-5 h-5 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              />
              <h3
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Bell
                className={`w-10 h-10 mb-3 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <h4
                className={`text-base font-medium mb-1 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                No notifications
              </h4>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 relative ${
                    !notification.read
                      ? isDark
                        ? "bg-gray-700/20"
                        : "bg-blue-50/30"
                      : ""
                  }`}
                >
                  {!notification.read && (
                    <div className="absolute left-2 top-5 w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}

                  <div className="flex items-start gap-3 ml-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h4
                            className={`text-sm font-medium leading-5 ${
                              notification.read
                                ? isDark
                                  ? "text-gray-300"
                                  : "text-gray-700"
                                : isDark
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <p
                            className={`text-sm mt-1 leading-5 ${
                              notification.read
                                ? isDark
                                  ? "text-gray-400"
                                  : "text-gray-500"
                                : isDark
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-3 h-3 text-blue-600" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              onDeleteNotification(notification.id)
                            }
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (if more than 10 notifications) */}
        {notifications.length > 10 && (
          <div
            className={`px-4 py-2 border-t ${
              isDark ? "border-gray-700" : "border-gray-200"
            } rounded-b-lg`}
          >
            <p
              className={`text-xs text-center ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Showing 10 of {notifications.length} notifications
            </p>
          </div>
        )}
      </div>
    </>
  );
};
