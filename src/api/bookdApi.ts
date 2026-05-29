import { api, API_BASE } from './client';
import type {
  AutoTagResponse,
  BackgroundParseStatus,
  AiEndpoint,
  AiEndpointRequest,
  AiModel,
  AiModelRequest,
  AiProvider,
  AiProviderRequest,
  Book,
  BookCountResponse,
  BookMetadataUpdate,
  BookSource,
  BooksResponse,
  ChaptersResponse,
  DirectoryListResponse,
  ImportRulesResponse,
  InviteToken,
  LoginResponse,
  MergeTagsResponse,
  PersonalizationOverview,
  PersonalizationSettings,
  ScanResponse,
  ScanStatusResponse,
  Tag,
  TagWithStats,
  TxtParseRule,
  TxtParseRuleRequest,
  User
} from './types';

export const authApi = {
  hasAdmin: () => api.get<{ hasAdmin: boolean }>(`${API_BASE}/auth/has-admin`),
  login: (username: string, password: string) => api.post<LoginResponse>(`${API_BASE}/auth/login`, { username, password }),
  setup: (username: string, password: string, email: string | null) =>
    api.post<User>(`${API_BASE}/auth/setup`, { username, password, email }),
  registerGuest: (username: string, password: string, email: string | null) =>
    api.post<User>(`${API_BASE}/auth/register/guest`, { username, password, email, inviteToken: null }),
  registerUser: (username: string, password: string, email: string | null, inviteToken: string) =>
    api.post<User>(`${API_BASE}/auth/register/user`, { username, password, email, inviteToken }),
  me: () => api.get<User>(`${API_BASE}/auth/me`),
  logout: () => api.post<{ message?: string }>(`${API_BASE}/auth/logout`, {})
};

export const userApi = {
  list: () => api.get<User[]>(`${API_BASE}/users`),
  delete: (userId: number) => api.delete<{ success: boolean }>(`${API_BASE}/users/${userId}`),
  createInviteToken: () => api.post<InviteToken>(`${API_BASE}/users/invite-tokens`, {}),
  inviteTokens: () => api.get<InviteToken[]>(`${API_BASE}/users/invite-tokens`)
};

export const sourceApi = {
  list: () => api.get<BookSource[]>(`${API_BASE}/sources`),
  create: (name: string, path: string) => api.post<BookSource>(`${API_BASE}/sources`, { name, path }),
  delete: (sourceId: number) => api.delete<{ success: boolean }>(`${API_BASE}/sources/${sourceId}`),
  toggle: (sourceId: number) => api.post<{ message?: string }>(`${API_BASE}/sources/${sourceId}/toggle`, {})
};

export const filesystemApi = {
  list: (path: string) => api.get<DirectoryListResponse>(`${API_BASE}/filesystem/list?path=${encodeURIComponent(path)}`)
};

export const bookApi = {
  count: (sourceId?: number | null) =>
    api.get<BookCountResponse>(`${API_BASE}/books/count${sourceId ? `?sourceId=${sourceId}` : ''}`),
  list: (params: { sourceId?: number | null; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    query.set('limit', String(params.limit ?? 500));
    if (params.offset) query.set('offset', String(params.offset));
    if (params.sourceId) query.set('sourceId', String(params.sourceId));
    return api.get<BooksResponse>(`${API_BASE}/books?${query.toString()}`);
  },
  detail: (bookId: number) => api.get<Book>(`${API_BASE}/books/${bookId}`),
  chapters: (bookId: number) => api.get<ChaptersResponse>(`${API_BASE}/books/${bookId}/chapters`),
  reparse: (bookId: number) => api.post<{ message?: string }>(`${API_BASE}/books/${bookId}/reparse`, {}),
  uploadCover: (bookId: number, formData: FormData) =>
    api.upload<{ success: boolean; coverPath: string }>(`${API_BASE}/books/${bookId}/cover`, formData),
  updateMetadata: (bookId: number, data: BookMetadataUpdate) =>
    api.put<{ success: boolean; book: Book | null }>(`${API_BASE}/books/${bookId}/metadata`, data)
};

export const scanApi = {
  status: () => api.get<ScanStatusResponse>(`${API_BASE}/scan/status`),
  source: (sourceId: number, fullScan: boolean) =>
    api.post<ScanResponse>(`${API_BASE}/scan/source/${sourceId}?fullScan=${fullScan}`, {}),
  all: (fullScan: boolean) => api.post<ScanResponse>(`${API_BASE}/scan/all?fullScan=${fullScan}`, {})
};

export const tagApi = {
  list: () => api.get<TagWithStats[]>(`${API_BASE}/tags`),
  create: (name: string) => api.post<Tag>(`${API_BASE}/tags`, { name }),
  delete: (tagId: number) => api.delete<{ success: boolean }>(`${API_BASE}/tags/${tagId}`),
  books: (tagId: number) => api.get<Book[]>(`${API_BASE}/tags/${tagId}/books`),
  forBook: (bookId: number) => api.get<Tag[]>(`${API_BASE}/tags/book/${bookId}`),
  addToBook: (bookId: number, tagName: string) => api.post<Tag>(`${API_BASE}/tags/book/${bookId}`, { tagName }),
  removeFromBook: (bookId: number, tagId: number) => api.delete<{ success: boolean }>(`${API_BASE}/tags/book/${bookId}/${tagId}`),
  autoTagAll: () => api.post<AutoTagResponse>(`${API_BASE}/tags/auto-tag/all`, {}),
  merge: (sourceTagIds: number[], targetTagName: string) =>
    api.post<MergeTagsResponse>(`${API_BASE}/tags/merge`, { sourceTagIds, targetTagName })
};

export const txtRuleApi = {
  list: () => api.get<TxtParseRule[]>(`${API_BASE}/txt-parse-rules`),
  detail: (id: number) => api.get<TxtParseRule>(`${API_BASE}/txt-parse-rules/${id}`),
  create: (request: TxtParseRuleRequest) => api.post<TxtParseRule>(`${API_BASE}/txt-parse-rules`, request),
  update: (id: number, request: TxtParseRuleRequest) => api.put<{ message?: string }>(`${API_BASE}/txt-parse-rules/${id}`, request),
  delete: (id: number) => api.delete<{ message?: string }>(`${API_BASE}/txt-parse-rules/${id}`),
  toggle: (id: number) => api.post<{ message?: string }>(`${API_BASE}/txt-parse-rules/${id}/toggle`, {}),
  importJson: (jsonContent: string) =>
    api.post<ImportRulesResponse>(`${API_BASE}/txt-parse-rules/import`, { jsonContent, useFile: false })
};

export const backgroundParseApi = {
  status: () => api.get<BackgroundParseStatus>(`${API_BASE}/background-parse/status`),
  start: () => api.post<{ message?: string }>(`${API_BASE}/background-parse/start`, {}),
  stop: () => api.post<{ message?: string }>(`${API_BASE}/background-parse/stop`, {})
};

export const personalizationApi = {
  overview: () => api.get<PersonalizationOverview>(`${API_BASE}/admin/personalization`),
  settings: () => api.get<PersonalizationSettings>(`${API_BASE}/admin/settings/personalization`),
  updateTimeZone: (timeZone: string) => api.put<PersonalizationSettings>(`${API_BASE}/admin/settings/time-zone`, { timeZone })
};

export const aiProviderApi = {
  list: () => api.get<AiProvider[]>(`${API_BASE}/admin/ai-providers`),
  create: (request: AiProviderRequest) => api.post<AiProvider>(`${API_BASE}/admin/ai-providers`, request),
  update: (providerId: number, request: AiProviderRequest) => api.put<AiProvider>(`${API_BASE}/admin/ai-providers/${providerId}`, request),
  delete: (providerId: number) => api.delete<{ success: boolean }>(`${API_BASE}/admin/ai-providers/${providerId}`),
  createEndpoint: (providerId: number, request: AiEndpointRequest) =>
    api.post<AiEndpoint>(`${API_BASE}/admin/ai-providers/${providerId}/endpoints`, request)
};

export const aiEndpointApi = {
  update: (endpointId: number, request: AiEndpointRequest) => api.put<AiEndpoint>(`${API_BASE}/admin/ai-endpoints/${endpointId}`, request),
  delete: (endpointId: number) => api.delete<{ success: boolean }>(`${API_BASE}/admin/ai-endpoints/${endpointId}`),
  createModel: (endpointId: number, request: AiModelRequest) =>
    api.post<AiModel>(`${API_BASE}/admin/ai-endpoints/${endpointId}/models`, request)
};

export const aiModelApi = {
  update: (modelId: number, request: AiModelRequest) => api.put<AiModel>(`${API_BASE}/admin/ai-models/${modelId}`, request),
  delete: (modelId: number) => api.delete<{ success: boolean }>(`${API_BASE}/admin/ai-models/${modelId}`)
};
