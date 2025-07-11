// components/layout/sidebar/Sidebar.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Building,
  Calendar,
  MessageCircle,
  User,
  LogOut,
  X,
  Settings,
  Shield,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { MenuItem } from "../../../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
    { id: "spaces", label: "Spaces", icon: Building, path: "/spaces" },
    { id: "bookings", label: "My Bookings", icon: Calendar, path: "/bookings" },
    {
      id: "support",
      label: "Customer Support",
      icon: MessageCircle,
      path: "/support",
    },
  ];

  const adminMenuItems: MenuItem[] = [
    { id: "admin", label: "Admin Panel", icon: Shield, path: "/admin" },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close mobile menu after navigation
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-r`}
      >
        <SidebarContent
          user={user}
          isDark={isDark}
          location={location}
          menuItems={menuItems}
          adminMenuItems={adminMenuItems}
          onNavigation={handleNavigation}
          onLogout={handleLogout}
          onClose={() => {}} // No close needed for desktop
          showCloseButton={false}
        />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-64 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-r`}
      >
        <SidebarContent
          user={user}
          isDark={isDark}
          location={location}
          menuItems={menuItems}
          adminMenuItems={adminMenuItems}
          onNavigation={handleNavigation}
          onLogout={handleLogout}
          onClose={onClose}
          showCloseButton={true}
        />
      </div>
    </>
  );
};

// Extracted sidebar content to avoid duplication
interface SidebarContentProps {
  user: any;
  isDark: boolean;
  location: any;
  menuItems: MenuItem[];
  adminMenuItems: MenuItem[];
  onNavigation: (path: string) => void;
  onLogout: () => void;
  onClose: () => void;
  showCloseButton: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  user,
  isDark,
  location,
  menuItems,
  adminMenuItems,
  onNavigation,
  onLogout,
  onClose,
  showCloseButton,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDark ? "bg-blue-900" : "bg-blue-100"
            }`}
          >
            <span className="text-lg font-bold text-blue-600">C</span>
          </div>
          <h1
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            CoHub
          </h1>
        </div>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X
              className={`w-5 h-5 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
        {/* Main Menu */}
        <div>
          <h3
            className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Main Menu
          </h3>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/dashboard" &&
                  location.pathname.startsWith(item.path));

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : isDark
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Admin Menu (only for admins) */}
        {user?.role === "admin" && (
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Administration
            </h3>
            <ul className="space-y-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path);

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigation(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-purple-600 text-white shadow-md"
                          : isDark
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User section */}
      <div
        className={`p-4 border-t ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* User info */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDark ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <User
                className={`w-5 h-5 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {user?.name || "User"}
            </p>
            <p
              className={`text-xs truncate ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {user?.email || "user@example.com"}
            </p>
            {user?.role === "admin" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Profile and Logout buttons */}
        <div className="space-y-1">
          <button
            onClick={() => onNavigation("/profile")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === "/profile"
                ? "bg-gray-200 dark:bg-gray-700"
                : isDark
                ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <User className="w-4 h-4" />
            Profile Settings
          </button>

          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? "text-gray-300 hover:bg-red-900 hover:text-red-300"
                : "text-gray-700 hover:bg-red-50 hover:text-red-700"
            }`}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
