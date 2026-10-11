import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MapaEmpresas from './MapaEmpresas';

const mocks = vi.hoisted(() => ({
  companies: Array.from({ length: 120 }, (_, i) => ({
    id: `empresa-${i}`, name: `Empresa ${i}`, city: 'São Paulo', state: 'SP',
    address: null, extra_data_rf: null, lat: null as number | null, lng: null as number | null, company_addresses: [],
    relationship_score: null,
  })),
  geocode: vi.fn<(location: string, signal?: AbortSignal, retryMissing?: boolean) => Promise<{ lat: number; lng: number } | null>>(),
  insert: vi.fn(), invalidate: vi.fn(), success: vi.fn(), warning: vi.fn(),
}));
const initialCompanies = mocks.companies;

vi.mock('leaflet', () => ({ default: { Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } } } }));
vi.mock('leaflet.markercluster', () => ({}));
vi.mock('react-leaflet', () => ({ MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>, TileLayer: () => null }));
vi.mock('./mapa/MapMarkerCluster', () => ({ MarkerClusterLayer: ({ companies }: { companies: { id: string; name: string; lat: number; lng: number }[] }) => <div data-testid="markers">{companies.map(c => `${c.id}:${c.name}:${c.lat},${c.lng}`).join('|')}</div> }));
vi.mock('./mapa/companyQueries', () => ({ fetchMapCompanies: vi.fn() }));
vi.mock('./mapa/geocoding', () => ({ geocode: mocks.geocode, buildLocationString: () => 'São Paulo, Brasil' }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ insert: mocks.insert }) } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: () => null }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, warning: mocks.warning } }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mocks.companies, isLoading: false, error: null }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.companies = [...initialCompanies];
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  mocks.geocode.mockResolvedValue({ lat: -23, lng: -46 });
  mocks.insert.mockResolvedValue({ error: null });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('geolocalização do mapa', () => {
  it('limita o trabalho automático, conserva as empresas mapeadas e exige continuação manual', async () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(<MapaEmpresas />);
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(mocks.geocode).toHaveBeenCalledTimes(50);
    expect(screen.getByText(/50 empresas no mapa/)).toBeInTheDocument();
    mocks.companies = [...mocks.companies];
    rerender(<MapaEmpresas />);
    expect(mocks.geocode).toHaveBeenCalledTimes(50);
    fireEvent.click(screen.getByRole('button', { name: 'Geolocalizar mais (70)' }));
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(mocks.geocode).toHaveBeenCalledTimes(100);
    expect(screen.getByText(/100 empresas no mapa/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Geolocalizar mais (20)' })).toBeInTheDocument();
    unmount();
  });

  it('cancela a requisição em andamento ao sair do mapa', () => {
    mocks.geocode.mockImplementation((_location, signal) => new Promise((_resolve, reject) => {
      signal?.addEventListener('abort', () => reject(new DOMException('Cancelado', 'AbortError')));
    }));
    const { unmount } = render(<MapaEmpresas />);
    expect(mocks.geocode).toHaveBeenCalledTimes(1);
    const signal = mocks.geocode.mock.calls[0][1];
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('atualiza inclusões, exclusões e coordenadas no refetch sem iniciar outro lote', async () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(<MapaEmpresas />);
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(mocks.geocode).toHaveBeenCalledTimes(50);

    mocks.companies = [
      ...mocks.companies.filter(c => c.id !== 'empresa-1').map(c =>
        c.id === 'empresa-0' ? { ...c, name: 'Empresa atualizada', lat: -20, lng: -40 } : c,
      ),
      { ...mocks.companies[1], id: 'empresa-nova', name: 'Empresa nova', lat: -19, lng: -43 },
    ];
    rerender(<MapaEmpresas />);

    expect(screen.getByTestId('markers')).toHaveTextContent('empresa-0:Empresa atualizada:-20,-40');
    expect(screen.getByTestId('markers')).toHaveTextContent('empresa-nova:Empresa nova:-19,-43');
    expect(screen.getByTestId('markers')).not.toHaveTextContent('empresa-1:');
    expect(mocks.geocode).toHaveBeenCalledTimes(50);
    expect(screen.getByRole('button', { name: 'Geolocalizar mais (70)' })).toBeInTheDocument();
    unmount();
  });

  it('remove o marcador quando coordenadas antes salvas são apagadas', async () => {
    vi.useFakeTimers();
    mocks.companies = [{ ...mocks.companies[0], lat: -23, lng: -46 }];
    const { rerender, unmount } = render(<MapaEmpresas />);
    expect(screen.getByTestId('markers')).toHaveTextContent('empresa-0:');

    mocks.companies = [{ ...mocks.companies[0], lat: null, lng: null }];
    rerender(<MapaEmpresas />);
    expect(screen.queryByTestId('markers')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Geolocalizar mais (1)' })).toBeInTheDocument();
    expect(mocks.geocode).not.toHaveBeenCalled();
    unmount();
  });

  it('não confirma um lote cancelado durante o último intervalo', async () => {
    vi.useFakeTimers();
    const { unmount } = render(<MapaEmpresas />);
    await act(async () => { await vi.advanceTimersByTimeAsync(49 * 1100); });
    expect(mocks.geocode).toHaveBeenCalledTimes(50);
    unmount();
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});
