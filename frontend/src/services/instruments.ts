import { apiRequest } from '../lib/api';
import { ApiResponse, Instrument, InstrumentDetail, InstrumentStatus, PaginatedResponse } from '../types';

export interface InstrumentListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: InstrumentStatus | '';
}

export interface InstrumentInput {
  name: string;
  description?: string;
  displayOrder?: number;
  status: InstrumentStatus;
}

export function listInstruments(filters: InstrumentListFilters = {}) {
  return apiRequest<PaginatedResponse<Instrument>>('/instruments', { query: { ...filters } });
}

export function getInstrument(id: string) {
  return apiRequest<ApiResponse<InstrumentDetail>>(`/instruments/${id}`);
}

export function createInstrument(input: InstrumentInput) {
  return apiRequest<ApiResponse<Instrument>>('/instruments', { method: 'POST', body: input });
}

export function updateInstrument(id: string, input: Partial<InstrumentInput>) {
  return apiRequest<ApiResponse<Instrument>>(`/instruments/${id}`, { method: 'PUT', body: input });
}

export function deleteInstrument(id: string) {
  return apiRequest<ApiResponse<null>>(`/instruments/${id}`, { method: 'DELETE' });
}
