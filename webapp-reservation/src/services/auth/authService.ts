// API Service Layer - handles all HTTP requests
const API_URL = "http://localhost:8080/api/v1";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  position?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: "admin" | "manager" | "user";
    is_active: boolean;
    phone?: string;
    department?: string;
    position?: string;
    created_at: string;
    updated_at: string;
  };
  token: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "manager" | "user";
  is_active: boolean;
  phone?: string;
  department?: string;
  position?: string;
  created_at: string;
  updated_at: string;
}

class AuthService {
  // Helper method to handle API errors consistently
  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use status text
        errorMessage = response.statusText || errorMessage;
      }

      // Include status code for better error handling
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to server. Please check your connection."
        );
      }
      throw error;
    }
  }

  // Register user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to server. Please check your connection."
        );
      }
      throw error;
    }
  }

  // Get current user profile
  async getProfile(token: string): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await this.handleResponse(response);
      return data.user || data; // Handle different response structures
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to server. Please check your connection."
        );
      }

      // Check if it's specifically an auth error
      if ((error as any).status === 401 || (error as any).status === 403) {
        throw new Error("Unauthorized");
      }

      throw error;
    }
  }

  // Logout user
  async logout(token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Don't throw on logout errors - we'll clear storage anyway
      if (!response.ok) {
        console.warn(
          "Logout API call failed, but continuing with local cleanup"
        );
      }
    } catch (error) {
      // Don't throw error for logout - we'll clear local storage anyway
      console.error("Logout API error:", error);
    }
  }

  // Token validation helper
  async validateToken(token: string): Promise<boolean> {
    try {
      await this.getProfile(token);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
