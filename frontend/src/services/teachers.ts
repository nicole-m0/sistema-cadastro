import { apiRequest } from '../lib/api';
import { ApiResponse, PaginatedResponse, Teacher, TeacherStatus } from '../types';

export interface TeacherListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TeacherStatus | '';
  instrumentId?: string;
}

export interface TeacherInput {
  fullName: string;
  socialName?: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  specialty?: string;
  hireDate?: string;
  status: TeacherStatus;
  photoUrl?: string;
  photoPublicId?: string;
  bio?: string;
  instrumentIds: string[];
}

export function listTeachers(filters: TeacherListFilters) {
  return apiRequest<PaginatedResponse<Teacher>>('/teachers', { query: { ...filters } });
}

export function getTeacher(id: string) {
  return apiRequest<ApiResponse<Teacher>>(`/teachers/${id}`);
}

export function createTeacher(input: TeacherInput) {
  return apiRequest<ApiResponse<Teacher>>('/teachers', { method: 'POST', body: input });
}

export function updateTeacher(id: string, input: Partial<TeacherInput>) {
  return apiRequest<ApiResponse<Teacher>>(`/teachers/${id}`, { method: 'PUT', body: input });
}

export function deleteTeacher(id: string) {
  return apiRequest<ApiResponse<null>>(`/teachers/${id}`, { method: 'DELETE' });
}
