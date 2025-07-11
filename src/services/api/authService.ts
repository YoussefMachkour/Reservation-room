import { apiClient } from './apiClient';
import { ApiResponse, User } from '../../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    // Transform the data to match the Go backend expectations
    const requestData = {
      email: credentials.email,
      password: credentials.password,
    };
    return apiClient.post<AuthResponse>('/auth/login', requestData);
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    // Transform the data to match the Go backend expectations (snake_case)
    const requestData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password,
    };
    return apiClient.post<AuthResponse>('/auth/register', requestData);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/refresh', request);
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/forgot-password', request);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password', request);
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/profile');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/profile', data);
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.put<void>('/password', data);
  }

  // Admin endpoints
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>('/admin/users');
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>(`/admin/users/search?q=${encodeURIComponent(query)}`);
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`/admin/users/${userId}/role`, { role });
  }

  async activateUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`/admin/users/${userId}/activate`);
  }

  async deactivateUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`/admin/users/${userId}/deactivate`);
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/admin/users/${userId}`);
  }
}

export const authService = new AuthService();
