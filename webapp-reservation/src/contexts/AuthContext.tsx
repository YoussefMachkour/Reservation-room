import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  authService,
  User,
  RegisterRequest,
} from "../services/auth/authService";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
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

        if (savedToken) {
          setToken(savedToken);

          // Verify token is still valid by fetching user data
          try {
            const userData = await authService.getProfile(savedToken);
            setUser(userData);
          } catch (error) {
            // Token is invalid, clear it
            console.error("Token validation failed:", error);
            localStorage.removeItem("cohub-token");
            localStorage.removeItem("cohub-user");
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

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      const response = await authService.register(userData);

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
        register,
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
