import { apiRequest } from '../lib/api';
import { ApiResponse, PaginatedResponse, Project, ProjectDetail, ProjectStatus } from '../types';

export interface ProjectListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProjectStatus | '';
}

export interface ProjectInput {
  name: string;
  description?: string;
  objective?: string;
  location?: string;
  responsible?: string;
  notes?: string;
  imageUrl?: string;
  imagePublicId?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  instrumentIds: string[];
}

export function listProjects(filters: ProjectListFilters = {}) {
  return apiRequest<PaginatedResponse<Project>>('/projects', { query: { ...filters } });
}

export function getProject(id: string) {
  return apiRequest<ApiResponse<ProjectDetail>>(`/projects/${id}`);
}

export function createProject(input: ProjectInput) {
  return apiRequest<ApiResponse<Project>>('/projects', { method: 'POST', body: input });
}

export function updateProject(id: string, input: Partial<ProjectInput>) {
  return apiRequest<ApiResponse<Project>>(`/projects/${id}`, { method: 'PUT', body: input });
}

export function deleteProject(id: string) {
  return apiRequest<ApiResponse<null>>(`/projects/${id}`, { method: 'DELETE' });
}

export function linkProjectInstrument(id: string, instrumentId: string) {
  return apiRequest<ApiResponse<null>>(`/projects/${id}/instruments`, {
    method: 'POST',
    body: { instrumentId },
  });
}

export function unlinkProjectInstrument(id: string, instrumentId: string) {
  return apiRequest<ApiResponse<null>>(`/projects/${id}/instruments/${instrumentId}`, {
    method: 'DELETE',
  });
}
