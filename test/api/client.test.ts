import { api, ApiError } from '../../src/api/client';
import { setCurrentLocale } from '../../src/i18n';

function mockJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers as Record<string, string> | undefined) }
  });
}

describe('api client', () => {
  test('unwraps success response data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ data: { ok: true } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/api/test')).resolves.toEqual({ ok: true });
  });

  test('throws api error for backend error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockJsonResponse({ code: 'BOOK_001', message: 'bad', details: 'x' }, { status: 400 })));

    await expect(api.get('/api/test')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'BOOK_001',
      status: 400,
      message: 'bad',
      details: 'x'
    } satisfies Partial<ApiError>);
  });

  test('returns success object for 204 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(api.delete('/api/test')).resolves.toEqual({ success: true });
  });

  test('adds auth and language headers for json request', async () => {
    setCurrentLocale('en');
    window.localStorage.setItem('authToken', 'token-1');
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ data: true }));
    vi.stubGlobal('fetch', fetchMock);

    await api.post('/api/test', { name: 'Book' });

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-1');
    expect(headers.get('Accept-Language')).toBe('en');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ name: 'Book' }));
  });

  test('uses selected Chinese locale for request language header', async () => {
    setCurrentLocale('zh-CN');
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ data: true }));
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/api/test');

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Accept-Language')).toBe('zh-CN');
  });

  test('does not set content type for form data upload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ data: { coverPath: '/covers/1.jpg' } }));
    vi.stubGlobal('fetch', fetchMock);
    const formData = new FormData();
    formData.append('cover', new Blob(['x']));

    await api.upload('/api/books/1/cover', formData);

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.has('Content-Type')).toBe(false);
    expect(fetchMock.mock.calls[0][1].body).toBe(formData);
  });

  test('localizes client-side network errors', async () => {
    setCurrentLocale('en');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(api.get('/api/test')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
      message: 'Network error. Please try again later.',
      details: 'offline'
    } satisfies Partial<ApiError>);
  });
});
