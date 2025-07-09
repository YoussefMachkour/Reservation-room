// pages/profile/ProfilePage.tsx
import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { User as UserType } from "../../types";
import { Button } from "../../components/ui/button/Button";
import { Input } from "../../components/ui/input/Input";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showBookings: boolean;
  };
}

// Helper functions for your User type
const getUserInitials = (user: UserType): string => {
  return user.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const isAdmin = (user: UserType): boolean => {
  return user.role === "admin";
};

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "profile" | "preferences" | "security"
  >("profile");
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Mock preferences (in real app, this would come from API)
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profileVisible: true,
      showBookings: false,
    },
  });

  const [editedProfile, setEditedProfile] = useState<UpdateProfileRequest>({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
  });

  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // TODO: Implement profile update API call
      // await profileService.updateProfile(editedProfile);

      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would update the user state here
      console.log("Profile updated:", editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    });
    setIsEditing(false);
    setError("");
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditedProfile((prev) => ({
          ...prev,
          avatar: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreferenceChange = (
    category: "notifications" | "privacy",
    key: string,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setSaving(true);
    setError("");
    try {
      // TODO: Implement password change API call
      // await authService.changePassword(passwordData);

      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Password updated");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowChangePassword(false);
      // Success feedback could be a toast notification in real app
    } catch (error) {
      console.error("Error updating password:", error);
      setError(
        "Failed to update password. Please check your current password."
      );
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setError("");
    try {
      // In real app: await updatePreferences(preferences);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error updating preferences:", error);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "user":
        return "User";
      default:
        return "User";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "user":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-3xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Profile Settings
          </h1>
          <p className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            Manage your account settings and preferences
          </p>
        </div>

        {activeTab === "profile" && (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="xl:col-span-1">
          <div
            className={`rounded-lg shadow-sm border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              {/* Profile Overview */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      isDark ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className={`text-2xl font-bold ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {getUserInitials(user)}
                      </span>
                    )}
                  </div>
                  {isAdmin(user) && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <h3
                  className={`mt-3 text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {user.name}
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {user.email}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getRoleColor(
                    user.role
                  )}`}
                >
                  {getRoleDisplay(user.role)}
                </span>
                <div
                  className={`text-xs mt-2 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Member since{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3">
          <div
            className={`rounded-lg shadow-sm border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <h2
                    className={`text-xl font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Personal Information
                  </h2>

                  {/* Error Message */}
                  <ErrorMessage error={error} />

                  {/* Avatar Upload */}
                  {isEditing && (
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          isDark ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        {editedProfile.avatar ? (
                          <img
                            src={editedProfile.avatar}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className={`text-xl font-bold ${
                              isDark ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {getUserInitials(user)}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <Camera className="w-4 h-4" />
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                        <p
                          className={`text-sm mt-1 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          JPG, PNG up to 2MB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      type="text"
                      value={isEditing ? editedProfile.name : user.name}
                      onChange={(e) =>
                        isEditing &&
                        setEditedProfile((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      leftIcon={User}
                      required
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      value={user.email}
                      disabled={true}
                      leftIcon={Mail}
                    />

                    <div>
                      <Input
                        label="Role"
                        type="text"
                        value={getRoleDisplay(user.role)}
                        disabled={true}
                        leftIcon={Shield}
                      />
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Contact an administrator to change your role
                      </p>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Member Since
                      </label>
                      <p
                        className={`py-2 ${
                          isDark ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Account Timestamps */}
                  <div
                    className={`p-4 rounded-lg ${
                      isDark ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`font-medium mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Account Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span
                          className={`font-medium ${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Created:{" "}
                        </span>
                        <span
                          className={isDark ? "text-gray-400" : "text-gray-500"}
                        >
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`font-medium ${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Last Updated:{" "}
                        </span>
                        <span
                          className={isDark ? "text-gray-400" : "text-gray-500"}
                        >
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div className="space-y-6">
                  <h2
                    className={`text-xl font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Preferences
                  </h2>

                  {/* Notifications */}
                  <div>
                    <h3
                      className={`text-lg font-medium mb-4 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(preferences.notifications).map(
                        ([key, value]) => (
                          <label
                            key={key}
                            className="flex items-center justify-between"
                          >
                            <span
                              className={`${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {key === "email" && "Email notifications"}
                              {key === "push" && "Push notifications"}
                              {key === "sms" && "SMS notifications"}
                            </span>
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "notifications",
                                  key,
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  {/* Privacy */}
                  <div>
                    <h3
                      className={`text-lg font-medium mb-4 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Privacy
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(preferences.privacy).map(
                        ([key, value]) => (
                          <label
                            key={key}
                            className="flex items-center justify-between"
                          >
                            <span
                              className={`${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {key === "profileVisible" &&
                                "Make profile visible to other users"}
                              {key === "showBookings" &&
                                "Show my bookings to others"}
                            </span>
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "privacy",
                                  key,
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  <Button onClick={savePreferences} loading={loading}>
                    Save Preferences
                  </Button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2
                    className={`text-xl font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Security Settings
                  </h2>

                  {/* Error Message for Security Tab */}
                  <ErrorMessage error={error} />

                  {/* Change Password */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-lg font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Password
                      </h3>
                      <button
                        onClick={() =>
                          setShowChangePassword(!showChangePassword)
                        }
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Change Password
                      </button>
                    </div>

                    {showChangePassword && (
                      <div className="space-y-4 p-4 border rounded-lg border-gray-300 dark:border-gray-600">
                        <Input
                          label="Current Password"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          leftIcon={Lock}
                          rightIcon={showPasswords.current ? EyeOff : Eye}
                          onRightIconClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                          required
                        />

                        <Input
                          label="New Password"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          leftIcon={Lock}
                          rightIcon={showPasswords.new ? EyeOff : Eye}
                          onRightIconClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                          required
                        />

                        <Input
                          label="Confirm New Password"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          leftIcon={Lock}
                          rightIcon={showPasswords.confirm ? EyeOff : Eye}
                          onRightIconClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                          required
                        />

                        <div className="flex gap-3">
                          <Button
                            onClick={handlePasswordChange}
                            loading={loading}
                            disabled={
                              !passwordData.currentPassword ||
                              !passwordData.newPassword ||
                              !passwordData.confirmPassword
                            }
                          >
                            Update Password
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowChangePassword(false);
                              setPasswordData({
                                currentPassword: "",
                                newPassword: "",
                                confirmPassword: "",
                              });
                              setError("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Account Security Info */}
                  <div
                    className={`p-4 rounded-lg ${
                      isDark ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`font-medium mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Account Security
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        • Use a strong password with at least 8 characters
                      </p>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        • Include uppercase, lowercase, numbers, and symbols
                      </p>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        • Don't reuse passwords from other accounts
                      </p>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        • Contact support if you suspect unauthorized access
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
