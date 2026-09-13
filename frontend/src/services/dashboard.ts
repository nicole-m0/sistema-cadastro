import { apiRequest } from '../lib/api';
import { ApiResponse, DashboardSummary } from '../types';

export function getDashboardSummary() {
  return apiRequest<ApiResponse<DashboardSummary>>('/dashboard');
}
