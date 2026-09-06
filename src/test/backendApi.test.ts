import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { backendApi } from '@/services/backendApi';

const AUTH_STORAGE_KEY = 'arycar_auth_user';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('backendApi', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra a mensagem da API, e não o JSON cru, quando a requisição falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Credenciais inválidas.' })));

    await expect(backendApi.login({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrowError('Credenciais inválidas.');
  });

  it('cai para o texto puro quando o erro não é JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 })));

    await expect(backendApi.login({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrowError('Bad Gateway');
  });

  it('envia o token salvo no header Authorization', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ name: 'Admin', role: 'admin', token: 'tok-123' }));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);

    await backendApi.listServices();

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-123');
  });

  it('não envia Authorization quando não há sessão', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);

    await backendApi.listServices();

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('limpa a sessão local quando a API responde 401', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ name: 'Admin', role: 'admin', token: 'expirado' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Sessão inválida ou expirada.' })));

    await expect(backendApi.listProducts()).rejects.toThrowError();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
