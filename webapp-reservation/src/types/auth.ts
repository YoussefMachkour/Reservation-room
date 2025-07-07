export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string;
  phone?: string;
  profile_picture?: string;
  department?: string;
  position?: string;
  created_at: string;
  updated_at: string;
  
  // Relationships (optional for frontend)
  reservations?: any[];
  managed_spaces?: any[];
}

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
  user: User;
  token: string;
  expires_at: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_picture?: string;
  department?: string;
  position?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
}

// Helper functions for User model
export const getUserFullName = (user: User): string => {
  return `${user.first_name} ${user.last_name}`;
};

export const getUserInitials = (user: User): string => {
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
};

export const isAdmin = (user: User): boolean => {
  return user.role === 'admin';
};

export const isManager = (user: User): boolean => {
  return user.role === 'manager';
};

export const canManageSpaces = (user: User): boolean => {
  return user.role === 'admin' || user.role === 'manager';
};

export const isUserActive = (user: User): boolean => {
  return user.is_active;
};