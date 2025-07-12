import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService, User } from "../services/auth/authService";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem("cohub-token");
        const savedUser = localStorage.getItem("cohub-user");

        if (savedToken) {
          setToken(savedToken);

          // If we have saved user data, use it immediately for better UX
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setUser(parsedUser);
            } catch (error) {
              console.error("Failed to parse saved user data:", error);
            }
          }

          // Verify token is still valid by fetching fresh user data
          try {
            const userData = await authService.getProfile(savedToken);
            setUser(userData);
            // Update localStorage with fresh user data
            localStorage.setItem("cohub-user", JSON.stringify(userData));
          } catch (error) {
            console.error("Token validation failed:", error);

            // Only clear auth if it's definitely an auth error (401/403)
            // Don't clear on network errors, server errors, etc.
            if (error instanceof Error) {
              const isAuthError =
                error.message.includes("Unauthorized") ||
                error.message.includes("401") ||
                error.message.includes("403");

              if (isAuthError) {
                console.log("Auth error detected, clearing stored credentials");
                localStorage.removeItem("cohub-token");
                localStorage.removeItem("cohub-user");
                setToken(null);
                setUser(null);
              } else {
                console.log(
                  "Non-auth error, keeping stored credentials:",
                  error.message
                );
                // Keep the saved user data for offline functionality
              }
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authService.login({ email, password });

      setUser(response.user);
      setToken(response.token);

      // Store in localStorage
      localStorage.setItem("cohub-token", response.token);
      localStorage.setItem("cohub-user", JSON.stringify(response.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear state and localStorage regardless of API call success
      setUser(null);
      setToken(null);
      localStorage.removeItem("cohub-token");
      localStorage.removeItem("cohub-user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
