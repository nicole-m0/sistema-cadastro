import { apiRequest } from '../lib/api';
import { ApiResponse, Instrument } from '../types';

export function listInstruments() {
  return apiRequest<ApiResponse<Instrument[]>>('/instruments');
}

export function createInstrument(name: string) {
  return apiRequest<ApiResponse<Instrument>>('/instruments', { method: 'POST', body: { name } });
}
