import { apiRequest } from '../lib/api';
import { ApiResponse, PaginatedResponse, Student, StudentStatus } from '../types';

export interface StudentListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: StudentStatus | '';
  instrumentId?: string;
  teacherId?: string;
}

export interface StudentInput {
  fullName: string;
  socialName?: string;
  birthDate?: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  instrumentId?: string;
  level: Student['level'];
  teacherId?: string;
  enrollmentDate?: string;
  status: StudentStatus;
  photoUrl?: string;
  photoPublicId?: string;
  notes?: string;
}

export function listStudents(filters: StudentListFilters) {
  return apiRequest<PaginatedResponse<Student>>('/students', { query: { ...filters } });
}

export function getStudent(id: string) {
  return apiRequest<ApiResponse<Student>>(`/students/${id}`);
}

export function createStudent(input: StudentInput) {
  return apiRequest<ApiResponse<Student>>('/students', { method: 'POST', body: input });
}

export function updateStudent(id: string, input: Partial<StudentInput>) {
  return apiRequest<ApiResponse<Student>>(`/students/${id}`, { method: 'PUT', body: input });
}

export function deleteStudent(id: string) {
  return apiRequest<ApiResponse<null>>(`/students/${id}`, { method: 'DELETE' });
}
