import { apiRequest } from '../lib/api';
import { Admin, ApiResponse } from '../types';

export function login(email: string, password: string) {
  return apiRequest<ApiResponse<Admin>>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logout() {
  return apiRequest<ApiResponse<null>>('/auth/logout', { method: 'POST' });
}

export function fetchCurrentAdmin() {
  return apiRequest<ApiResponse<Admin>>('/auth/me');
}
