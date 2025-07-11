import { apiClient } from './apiClient';
import { ApiResponse } from '../../types';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  service: string;
}

export interface ApiDocsResponse {
  service: string;
  version: string;
  description: string;
  author: string;
  endpoints: {
    public_endpoints: string[];
    user_endpoints: string[];
    manager_endpoints: string[];
    admin_endpoints: string[];
  };
}

class UtilityService {
  async healthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
    // Remove /api/v1 from the base URL for health check since it's at root level
    const baseUrl = apiClient.getBaseURL().replace('/api/v1', '');
    const originalBaseUrl = apiClient.getBaseURL();
    
    // Temporarily set base URL to root
    apiClient.setBaseURL(baseUrl);
    
    try {
      const result = await apiClient.get<HealthCheckResponse>('/health');
      return result;
    } finally {
      // Restore original base URL
      apiClient.setBaseURL(originalBaseUrl);
    }
  }

  async getApiDocs(): Promise<ApiResponse<ApiDocsResponse>> {
    // Remove /api/v1 from the base URL for docs since it's at /api level
    const baseUrl = apiClient.getBaseURL().replace('/v1', '');
    const originalBaseUrl = apiClient.getBaseURL();
    
    // Temporarily set base URL to /api
    apiClient.setBaseURL(baseUrl);
    
    try {
      const result = await apiClient.get<ApiDocsResponse>('/docs');
      return result;
    } finally {
      // Restore original base URL
      apiClient.setBaseURL(originalBaseUrl);
    }
  }
}

export const utilityService = new UtilityService();
