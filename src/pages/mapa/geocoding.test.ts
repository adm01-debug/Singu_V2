import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLocationString, geocode } from './geocoding';

const jsonResponse = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status });

afterEach(() => vi.unstubAllGlobals());

describe('geocode', () => {
  it('valida coordenadas e reutiliza apenas resultados válidos do cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ lat: '-23.5505', lon: '-46.6333' }]));
    vi.stubGlobal('fetch', fetchMock);
    expect(await geocode('São Paulo, SP')).toEqual({ lat: -23.5505, lng: -46.6333 });
    expect(await geocode('  SÃO PAULO, SP  ')).toEqual({ lat: -23.5505, lng: -46.6333 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retorna null somente para busca válida sem resultados', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);
    expect(await geocode('Local sem resultado')).toBeNull();
    expect(await geocode('Local sem resultado')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propaga falhas HTTP e permite tentar novamente sem cache de falha', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([], 429))
      .mockResolvedValueOnce(jsonResponse([{ lat: '0', lon: '0' }]));
    vi.stubGlobal('fetch', fetchMock);
    await expect(geocode('Local após limite')).rejects.toThrow('HTTP 429');
    expect(await geocode('Local após limite')).toEqual({ lat: 0, lng: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('a nova tentativa consulta um resultado ausente e mantém coordenadas já encontradas', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([{ lat: '0', lon: '-51' }]));
    vi.stubGlobal('fetch', fetchMock);
    expect(await geocode('Local recuperado')).toBeNull();
    expect(await geocode('Local recuperado', undefined, true)).toEqual({ lat: 0, lng: -51 });
    expect(await geocode('Local recuperado', undefined, true)).toEqual({ lat: 0, lng: -51 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    null, {}, [{ lat: 'NaN', lon: '10' }], [{ lat: '91', lon: '10' }],
    [{ lat: '10', lon: '-181' }], [{ lat: '', lon: '10' }],
    [{ lat: '10' }], [{ lat: 10, lon: 20 }], [null],
  ].map(payload => ({ payload })))('rejeita payload inválido no cenário %#', async ({ payload }) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)));
    await expect(geocode(`Resposta inválida ${JSON.stringify(payload)}`)).rejects.toThrow();
  });

  it('propaga cancelamento em vez de retornar localização ausente', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Cancelado', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(geocode('Busca cancelada', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: controller.signal }));
  });
});

describe('buildLocationString', () => {
  it('prioriza cidade e estado do endereço normalizado', () => {
    expect(buildLocationString({ city: 'Goiânia', state: 'GO', address: 'Rua A', extra_data_rf: null }))
      .toBe('Goiânia, GO, Brasil');
  });

  it('aceita cidade da Receita somente quando é uma string', () => {
    expect(buildLocationString({ city: null, state: null, address: null, extra_data_rf: { cidade_rfb: 'Brasília' } }))
      .toBe('Brasília, Brasil');
    expect(buildLocationString({ city: null, state: null, address: null, extra_data_rf: { cidade_rfb: 123 } }))
      .toBeNull();
  });

  it('usa logradouro quando não existe cidade e retorna null sem endereço', () => {
    expect(buildLocationString({ city: null, state: null, address: 'Rua B', extra_data_rf: null }))
      .toBe('Rua B, Brasil');
    expect(buildLocationString({ city: null, state: null, address: null, extra_data_rf: null })).toBeNull();
  });
});
