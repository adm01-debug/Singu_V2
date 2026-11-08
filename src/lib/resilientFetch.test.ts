import { afterEach, describe, expect, it, vi } from 'vitest';
import { resilientFetch } from './resilientFetch';

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

afterEach(() => vi.unstubAllGlobals());

describe('resilientFetch', () => {
  it('não repete um POST que retornou erro do servidor', async () => {
    const mockedFetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', mockedFetch);

    const response = await resilientFetch('/functions/v1/sequence-processor', { method: 'POST' });

    expect(response.status).toBe(500);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('não repete um POST cuja resposta de rede foi perdida', async () => {
    const mockedFetch = vi.fn().mockRejectedValue(new Error('Resposta perdida'));
    vi.stubGlobal('fetch', mockedFetch);

    await expect(resilientFetch('/functions/v1/sequence-processor', { method: 'POST' }))
      .rejects.toThrow('Resposta perdida');
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('mantém a tentativa adicional para consultas seguras', async () => {
    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', mockedFetch);

    const response = await resilientFetch('/rest/v1/sequences', { method: 'GET' }, { baseDelayMs: 0 });

    expect(response.status).toBe(200);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});
