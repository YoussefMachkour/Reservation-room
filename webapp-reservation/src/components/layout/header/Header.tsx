// components/layout/header/Header.tsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { NotificationDrawer } from "../../notifications/NotificationDrawer";
import { BreadcrumbItem } from "../../../types";

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home/dashboard
    breadcrumbs.push({ label: "Dashboard", path: "/dashboard" });

    // Add path segments
    pathSegments.forEach((segment, index) => {
      if (segment === "dashboard") return; // Skip dashboard as it's already added

      const path = "/" + pathSegments.slice(0, index + 1).join("/");
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        label: label.replace("-", " "),
        path: index === pathSegments.length - 1 ? undefined : path,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const getPageTitle = (): string => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path === "/spaces") return "Browse Spaces";
    if (path === "/bookings") return "My Bookings";
    if (path === "/support") return "Customer Support";
    if (path === "/profile") return "Profile Settings";
    if (path === "/admin") return "Admin Dashboard";

    // For dynamic routes
    if (path.startsWith("/spaces/")) return "Space Details";
    if (path.startsWith("/bookings/")) return "Booking Details";

    return "CoHub";
  };

  const handleProfileMenuToggle = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleNotificationToggle = () => {
    setIsNotificationOpen(!isNotificationOpen);
    // Close profile menu if open
    if (isProfileMenuOpen) {
      setIsProfileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 border-b ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu
                className={`w-6 h-6 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              />
            </button>

            {/* Page title and breadcrumbs */}
            <div>
              <h1
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {getPageTitle()}
              </h1>

              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-1 text-sm mt-1">
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && (
                      <span
                        className={`mx-2 ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        /
                      </span>
                    )}
                    {item.path ? (
                      <a
                        href={item.path}
                        className={`hover:underline ${
                          isDark
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-700"}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search spaces, bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={handleNotificationToggle}
              className={`p-2 rounded-lg transition-colors relative ${
                isDark
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={handleProfileMenuToggle}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  (
                  <User
                    className={`w-4 h-4 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  />
                  )
                </div>
                <div className="hidden md:block text-left">
                  <p
                    className={`text-sm font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user?.first_name + " " + user?.last_name}
                  </p>
                  <p
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {user?.role === "admin" ? "Administrator" : "Member"}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isProfileMenuOpen ? "rotate-180" : ""
                  } ${isDark ? "text-gray-400" : "text-gray-500"}`}
                />
              </button>

              {/* Profile dropdown */}
              {isProfileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />

                  {/* Menu */}
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-20 ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p
                        className={`font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {user?.first_name + " " + user?.last_name}
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-2">
                      <a
                        href="/profile"
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </a>

                      <a
                        href="/settings"
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        Preferences
                      </a>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isDark
                            ? "text-red-400 hover:bg-gray-700"
                            : "text-red-600 hover:bg-gray-100"
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onClearAll={clearAll}
      />
    </>
  );
};
