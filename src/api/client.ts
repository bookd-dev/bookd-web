export const API_BASE = '/api';

export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown;

  constructor(code: string, message: string, status: number, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object | null;
  skipUnwrap?: boolean;
}

export function getBrowserLanguage(): string {
  const lang = navigator.language || 'zh-CN';
  return lang.startsWith('zh') ? 'zh-CN' : 'en';
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem('authToken');
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function buildBody(body: ApiRequestOptions['body']): BodyInit | null | undefined {
  if (body === undefined || body === null) return body;
  if (isFormData(body)) return body;
  if (typeof body === 'string' || body instanceof Blob || body instanceof URLSearchParams) return body;
  return JSON.stringify(body);
}

export async function apiClient<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipUnwrap = false, headers: optionHeaders, body, ...fetchOptions } = options;
  const headers = new Headers(optionHeaders);

  headers.set('Accept-Language', getBrowserLanguage());

  if (body !== undefined && body !== null && !isFormData(body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      body: buildBody(body),
      headers
    });

    if (response.status === 204) {
      return { success: true } as T;
    }

    const json = await response.json();

    if (!response.ok) {
      throw new ApiError(
        json.code || 'UNKNOWN',
        json.message || '操作失败',
        response.status,
        json.details ?? null
      );
    }

    return (skipUnwrap ? json : json.data) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new ApiError('NETWORK_ERROR', '网络错误，请稍后重试', 0, message);
  }
}

export const api = {
  get: <T>(url: string, options: ApiRequestOptions = {}) => apiClient<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: ApiRequestOptions['body'], options: ApiRequestOptions = {}) =>
    apiClient<T>(url, { ...options, method: 'POST', body }),
  put: <T>(url: string, body?: ApiRequestOptions['body'], options: ApiRequestOptions = {}) =>
    apiClient<T>(url, { ...options, method: 'PUT', body }),
  delete: <T>(url: string, options: ApiRequestOptions = {}) => apiClient<T>(url, { ...options, method: 'DELETE' }),
  upload: <T>(url: string, formData: FormData, options: ApiRequestOptions = {}) =>
    apiClient<T>(url, { ...options, method: 'POST', body: formData })
};
