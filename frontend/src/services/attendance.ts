import { API_URL, apiRequest } from '../lib/api';
import {
  ApiResponse,
  AttendanceFrequencyRow,
  AttendanceSession,
  AttendanceSessionListItem,
  AttendanceStatus,
  PaginatedResponse,
} from '../types';

export interface AttendanceRecordInput {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface CreateAttendanceSessionInput {
  classGroupId: string;
  date: string;
  generalNotes?: string;
  records: AttendanceRecordInput[];
}

export interface UpdateAttendanceSessionInput {
  generalNotes?: string;
  records: AttendanceRecordInput[];
}

export interface ListSessionsFilters {
  page?: number;
  pageSize?: number;
  classGroupId?: string;
  projectId?: string;
  from?: string;
  to?: string;
}

export interface FrequencyFilters {
  from?: string;
  to?: string;
  instrumentId?: string;
  classGroupId?: string;
}

export function createAttendanceSession(input: CreateAttendanceSessionInput) {
  return apiRequest<ApiResponse<AttendanceSession>>('/attendance/sessions', {
    method: 'POST',
    body: input,
  });
}

export function updateAttendanceSession(id: string, input: UpdateAttendanceSessionInput) {
  return apiRequest<ApiResponse<AttendanceSession>>(`/attendance/sessions/${id}`, {
    method: 'PUT',
    body: input,
  });
}

export function listAttendanceSessions(filters: ListSessionsFilters = {}) {
  return apiRequest<PaginatedResponse<AttendanceSessionListItem>>('/attendance/sessions', {
    query: { ...filters },
  });
}

export function getAttendanceSession(id: string) {
  return apiRequest<ApiResponse<AttendanceSession>>(`/attendance/sessions/${id}`);
}

export function getStudentFrequency(studentId: string, filters: FrequencyFilters = {}) {
  return apiRequest<ApiResponse<AttendanceFrequencyRow[]>>(
    `/attendance/reports/student/${studentId}`,
    { query: { ...filters } },
  );
}

export function getClassGroupFrequency(classGroupId: string, filters: FrequencyFilters = {}) {
  return apiRequest<ApiResponse<AttendanceFrequencyRow[]>>(
    `/attendance/reports/class-group/${classGroupId}`,
    { query: { ...filters } },
  );
}

export function getProjectFrequency(projectId: string, filters: FrequencyFilters = {}) {
  return apiRequest<ApiResponse<AttendanceFrequencyRow[]>>(
    `/attendance/reports/project/${projectId}`,
    { query: { ...filters } },
  );
}

type FrequencyScope = 'student' | 'class-group' | 'project';

export async function downloadFrequencyReportCsv(
  scope: FrequencyScope,
  id: string,
  filters: FrequencyFilters = {},
) {
  const url = new URL(`${API_URL}/attendance/reports/${scope}/${id}`);
  url.searchParams.set('format', 'csv');
  for (const [key, value] of Object.entries(filters)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Não foi possível gerar o relatório em CSV.');
  }

  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'relatorio-frequencia.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
