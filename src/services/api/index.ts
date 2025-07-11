// API Client
export { apiClient } from './apiClient';

// Services
export { authService } from './authService';
export { spaceService } from './spaceService';
export { reservationService } from './reservationService';
export { statsService } from './statsService';
export { utilityService } from './utilityService';

// Types
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  RefreshTokenRequest,
} from './authService';

export type {
  SpaceSearchParams,
  AvailabilityRequest,
  CreateSpaceRequest,
  UpdateSpaceRequest,
  SpaceStatistics,
  DashboardStatistics,
} from './spaceService';

export type {
  CreateReservationRequest,
  UpdateReservationRequest,
  ReservationSearchParams,
  CalendarParams,
  CheckInResponse,
  CheckOutResponse,
  CheckInStatusResponse,
} from './reservationService';

export type {
  SystemStats,
  UserStats,
  RecentUser,
} from './statsService';

export type {
  HealthCheckResponse,
  ApiDocsResponse,
} from './utilityService';
