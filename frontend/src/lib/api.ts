export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  isFormData?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, isFormData } = options;

  const headers: HeadersInit = {};
  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    if (isFormData) {
      requestBody = body as FormData;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: requestBody,
    credentials: 'include',
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message = payload?.message ?? 'Ocorreu um erro ao comunicar com o servidor.';
    throw new ApiRequestError(response.status, message, payload?.details);
  }

  return payload as T;
}
