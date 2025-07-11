// components/layout/MainLayout.tsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { Sidebar } from "./sidebar/Sidebar";
import { Header } from "./header/Header";

export const MainLayout: React.FC = () => {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Fixed positioning */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main content area - Full width with left margin for sidebar */}
      <div className="w-full lg:pl-64">
        {/* Header - Full width */}
        <Header onMenuToggle={toggleMobileMenu} />

        {/* Page content - Full available width */}
        <main className="w-full p-6 min-h-[calc(100vh-4rem)] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
