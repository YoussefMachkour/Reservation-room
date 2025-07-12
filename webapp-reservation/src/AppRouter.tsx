import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

// Layout Components
import { MainLayout } from "./components/layout/MainLayout";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// Main Pages
import { SpaceDetailsPage } from "./pages/spaces/SpaceDetails";
import Dashboard from "./pages/dashboard/Dashboard";
import { SpacesPage } from "./pages/spaces/Spaces";
import { Bookings } from "./pages/bookings/Bookings";
import { SpaceBooking } from "./pages/bookings/SpaceBooking";
import { CustomerSupport } from "./pages/support/CustomerSupportPage";
import { ProfilePage } from "./pages/profile/ProfilePage";

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const { user, isLoading } = useAuth(); // Changed from 'loading' to 'isLoading'

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is active
  if (!user.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Account Inactive
          </h1>
          <p className="text-gray-600">
            Your account is not active. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Public Route Component
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth(); // Changed from 'loading' to 'isLoading'

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Spaces */}
        <Route path="spaces" element={<SpacesPage />} />
        <Route path="spaces/:id" element={<SpaceDetailsPage />} />

        {/* Bookings */}
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<SpaceBooking />} />

        {/* Customer Support */}
        <Route path="support" element={<CustomerSupport />} />

        {/* Profile */}
        <Route path="profile" element={<ProfilePage />} />

        {/* Admin Routes - Example for future use */}
        {/* 
        <Route 
          path="admin/*" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        /> 
        */}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
