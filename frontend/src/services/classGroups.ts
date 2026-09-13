import { apiRequest } from '../lib/api';
import {
  ApiResponse,
  ClassGroup,
  ClassGroupStatus,
  ClassTeacherRole,
  Enrollment,
  PaginatedResponse,
  Weekday,
} from '../types';

export interface ClassGroupListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ClassGroupStatus | '';
  projectId?: string;
  instrumentId?: string;
  teacherId?: string;
}

export interface ClassGroupInput {
  name: string;
  projectId: string;
  instrumentId: string;
  weekday: Weekday;
  startTime: string;
  endTime?: string;
  room?: string;
  capacity?: number;
  status: ClassGroupStatus;
  notes?: string;
  startDate?: string;
  endDate?: string;
  responsibleTeacherId: string;
  assistantTeacherIds: string[];
}

export function listClassGroups(filters: ClassGroupListFilters = {}) {
  return apiRequest<PaginatedResponse<ClassGroup>>('/class-groups', { query: { ...filters } });
}

export function getClassGroup(id: string) {
  return apiRequest<ApiResponse<ClassGroup>>(`/class-groups/${id}`);
}

export function createClassGroup(input: ClassGroupInput) {
  return apiRequest<ApiResponse<ClassGroup>>('/class-groups', { method: 'POST', body: input });
}

export function updateClassGroup(id: string, input: Partial<ClassGroupInput>) {
  return apiRequest<ApiResponse<ClassGroup>>(`/class-groups/${id}`, { method: 'PUT', body: input });
}

export function deleteClassGroup(id: string) {
  return apiRequest<ApiResponse<null>>(`/class-groups/${id}`, { method: 'DELETE' });
}

export function listClassGroupStudents(id: string, includeRemoved = false) {
  return apiRequest<ApiResponse<Enrollment[]>>(`/class-groups/${id}/students`, {
    query: { includeRemoved: includeRemoved ? 'true' : undefined },
  });
}

export function enrollStudent(id: string, studentId: string) {
  return apiRequest<ApiResponse<null>>(`/class-groups/${id}/students`, {
    method: 'POST',
    body: { studentId },
  });
}

export function removeEnrollment(id: string, studentId: string) {
  return apiRequest<ApiResponse<null>>(`/class-groups/${id}/students/${studentId}`, {
    method: 'DELETE',
  });
}

export function linkTeacher(id: string, teacherId: string, role: ClassTeacherRole) {
  return apiRequest<ApiResponse<null>>(`/class-groups/${id}/teachers`, {
    method: 'POST',
    body: { teacherId, role },
  });
}

export function unlinkTeacher(id: string, teacherId: string) {
  return apiRequest<ApiResponse<null>>(`/class-groups/${id}/teachers/${teacherId}`, {
    method: 'DELETE',
  });
}
