import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  department?: string;
  position?: string;
  submit?: string;
}

export const RegisterPage: React.FC = () => {
  const { isDark } = useTheme();
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = "First name must be at least 2 characters";
    }

    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = "Last name must be at least 2 characters";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      // Prepare data for backend (exclude confirmPassword, include only non-empty optional fields)
      const registerData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      await register(registerData);
      navigate("/dashboard");
    } catch (error) {
      setFormErrors({
        submit: error instanceof Error ? error.message : "Registration failed",
      });
    }
  };

  const handleChange = (field: keyof RegisterFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Background - Full Width Coverage */}
      <div
        className={`fixed inset-0 w-full h-full transition-all duration-1000 ${
          isDark
            ? "bg-gray-900"
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      >
        {/* Floating Orbs - Enhanced for Full Width */}
        <div className="absolute inset-0 w-full h-full">
          {/* Main Orbs */}
          <div
            className={`absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse ${
              isDark ? "bg-blue-600" : "bg-blue-400"
            }`}
            style={{
              top: "5%",
              left: "-10%",
              animation: "float 6s ease-in-out infinite",
            }}
          />

          <div
            className={`absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-pulse ${
              isDark ? "bg-purple-600" : "bg-purple-400"
            }`}
            style={{
              top: "40%",
              right: "-15%",
              animation: "float 8s ease-in-out infinite reverse",
            }}
          />

          <div
            className={`absolute w-80 h-80 rounded-full opacity-10 blur-3xl animate-pulse ${
              isDark ? "bg-indigo-600" : "bg-indigo-400"
            }`}
            style={{
              bottom: "10%",
              left: "-10%",
              animation: "float 7s ease-in-out infinite",
            }}
          />

          {/* Additional Orbs for Enhanced Full Width Coverage */}
          <div
            className={`absolute w-64 h-64 rounded-full opacity-15 blur-3xl animate-pulse ${
              isDark ? "bg-cyan-600" : "bg-cyan-400"
            }`}
            style={{
              top: "20%",
              right: "25%",
              animation: "float 9s ease-in-out infinite",
            }}
          />

          <div
            className={`absolute w-72 h-72 rounded-full opacity-12 blur-3xl animate-pulse ${
              isDark ? "bg-pink-600" : "bg-pink-400"
            }`}
            style={{
              bottom: "30%",
              right: "10%",
              animation: "float 7s ease-in-out infinite reverse",
            }}
          />

          <div
            className={`absolute w-80 h-80 rounded-full opacity-8 blur-3xl animate-pulse ${
              isDark ? "bg-green-600" : "bg-green-400"
            }`}
            style={{
              top: "70%",
              left: "30%",
              animation: "float 10s ease-in-out infinite",
            }}
          />

          {/* Extra Orbs for Edge Coverage */}
          <div
            className={`absolute w-96 h-96 rounded-full opacity-10 blur-3xl animate-pulse ${
              isDark ? "bg-yellow-600" : "bg-yellow-400"
            }`}
            style={{
              top: "0%",
              left: "50%",
              transform: "translateX(-50%)",
              animation: "float 11s ease-in-out infinite",
            }}
          />

          <div
            className={`absolute w-64 h-64 rounded-full opacity-8 blur-3xl animate-pulse ${
              isDark ? "bg-red-600" : "bg-red-400"
            }`}
            style={{
              bottom: "0%",
              right: "50%",
              transform: "translateX(50%)",
              animation: "float 8s ease-in-out infinite reverse",
            }}
          />

          <div
            className={`absolute w-72 h-72 rounded-full opacity-12 blur-3xl animate-pulse ${
              isDark ? "bg-teal-600" : "bg-teal-400"
            }`}
            style={{
              top: "50%",
              left: "0%",
              transform: "translateY(-50%) translateX(-25%)",
              animation: "float 9s ease-in-out infinite",
            }}
          />

          <div
            className={`absolute w-80 h-80 rounded-full opacity-10 blur-3xl animate-pulse ${
              isDark ? "bg-orange-600" : "bg-orange-400"
            }`}
            style={{
              top: "50%",
              right: "0%",
              transform: "translateY(-50%) translateX(25%)",
              animation: "float 10s ease-in-out infinite reverse",
            }}
          />
        </div>

        {/* Animated Grid - Full Width */}
        <div className="absolute inset-0 w-full h-full opacity-5">
          <div
            className={`w-full h-full ${isDark ? "bg-gray-800" : "bg-white"}`}
            style={{
              backgroundImage: `linear-gradient(${
                isDark ? "#374151" : "#e5e7eb"
              } 1px, transparent 1px), linear-gradient(90deg, ${
                isDark ? "#374151" : "#e5e7eb"
              } 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
              animation: "gridMove 20s linear infinite",
            }}
          />
        </div>

        {/* Gradient Overlay - Full Width */}
        <div
          className={`absolute inset-0 w-full h-full ${
            isDark
              ? "bg-gradient-to-br from-gray-900/50 via-transparent to-gray-900/50"
              : "bg-gradient-to-br from-white/30 via-transparent to-white/30"
          }`}
        />

        {/* Additional Blur Layer for Edge Softening */}
        <div
          className={`absolute inset-0 w-full h-full ${
            isDark
              ? "bg-gradient-to-r from-gray-900/20 via-transparent to-gray-900/20"
              : "bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"
          }`}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-500 transform hover:scale-105 ${
            isDark
              ? "bg-gray-800/80 border border-gray-700"
              : "bg-white/80 border border-white/20"
          }`}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300 ${
                isDark ? "bg-blue-900" : "bg-blue-100"
              }`}
            >
              <span className="text-2xl font-bold text-blue-600 animate-pulse">
                C
              </span>
            </div>
            <h1
              className={`text-3xl font-bold mb-2 transition-all duration-300 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Join CoHub
            </h1>
            <p
              className={`transition-all duration-300 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Create your account to get started
            </p>
          </div>

          {/* Error Message */}
          {formErrors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {formErrors.submit}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name Input */}
              <div className="relative">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    placeholder="First name"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500"
                    } ${formErrors.first_name ? "border-red-500" : ""}`}
                    required
                  />
                </div>
                {formErrors.first_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.first_name}
                  </p>
                )}
              </div>

              {/* Last Name Input */}
              <div className="relative">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    placeholder="Last name"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500"
                    } ${formErrors.last_name ? "border-red-500" : ""}`}
                    required
                  />
                </div>
                {formErrors.last_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Email Input */}
            <div className="relative">
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${formErrors.email ? "border-red-500" : ""}`}
                  required
                />
              </div>
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Password Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password Input */}
              <div className="relative">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Password"
                    className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500"
                    } ${formErrors.password ? "border-red-500" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm"
                    className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500"
                    } ${formErrors.confirmPassword ? "border-red-500" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start pt-2">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span
                className={`ml-2 text-sm ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Privacy Policy
                </Link>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};
