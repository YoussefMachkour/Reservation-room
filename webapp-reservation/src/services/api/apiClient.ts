import { ApiResponse } from "../../types";

interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
}

class ApiClient {
  private baseURL: string;

  constructor(
    baseURL: string = import.meta.env.VITE_API_URL ||
      "http://localhost:8080/api/v1"
  ) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...config.headers,
    };

    // Add auth token if available
    const token = localStorage.getItem("cohub-token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const requestBody = config.body ? JSON.stringify(config.body) : undefined;

      const response = await fetch(url, {
        method: config.method,
        headers,
        body: requestBody,
      });

      // Handle different response types
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      // Handle HTTP errors
      if (!response.ok) {
        // Handle specific error cases based on your Go backend
        if (response.status === 401) {
          // Token expired or invalid - clear tokens and redirect to login
          this.handleUnauthorized();
          return {
            success: false,
            message: data.error || "Unauthorized access",
          };
        }

        if (response.status === 403) {
          return {
            success: false,
            message: data.error || "Access forbidden",
          };
        }

        if (response.status === 404) {
          return {
            success: false,
            message: data.error || "Resource not found",
          };
        }

        if (response.status >= 500) {
          return {
            success: false,
            message: data.error || "Internal server error",
          };
        }

        // Other client errors (400, 422, etc.)
        return {
          success: false,
          message:
            data.error ||
            data.message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      // Success response
      return {
        success: true,
        data: data.data || data, // Handle both wrapped and direct responses
        message: data.message,
      };
    } catch (error) {
      console.error(`API Error (${config.method} ${endpoint}):`, error);

      // Handle network errors
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        return {
          success: false,
          message: "Network error - please check your connection",
        };
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private handleUnauthorized(): void {
    // Clear tokens
    localStorage.removeItem("cohub-token");
    localStorage.removeItem("cohub-refresh-token");

    // Dispatch event for components to listen to
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));

    // Only redirect if not already on login page
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body, headers });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body, headers });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", body, headers });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }

  // Upload file method
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(
          key,
          typeof value === "string" ? value : JSON.stringify(value)
        );
      });
    }

    const headers: Record<string, string> = {};

    // Add auth token if available
    const token = localStorage.getItem("cohub-token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.handleUnauthorized();
        }

        return {
          success: false,
          message:
            data.error ||
            data.message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`Upload Error (${endpoint}):`, error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // Helper methods
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  // Check if user has valid token
  hasValidToken(): boolean {
    const token = localStorage.getItem("cohub-token");
    return !!token;
  }

  // Clear all auth data
  clearAuth(): void {
    localStorage.removeItem("cohub-token");
    localStorage.removeItem("cohub-refresh-token");
  }

  // Get current token
  getToken(): string | null {
    return localStorage.getItem("cohub-token");
  }
}

export const apiClient = new ApiClient();
