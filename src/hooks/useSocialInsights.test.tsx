import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useSocialInsights, type SocialInsight } from './useSocialInsights';
import { SocialIntelligencePanel } from '@/components/contact-detail/SocialIntelligencePanel';
import { SocialMatchDetails } from '@/components/crm/commercial/components/SocialMatchDetails';

const mocks = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(),
  user: { id: 'usuario-a' } as { id: string } | null,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/hooks/useSocialIntelligence', () => ({ useSocialIntelligence: () => ({
  profiles: [], behaviorAnalysis: null, lifeEvents: [], loading: false,
  dismissEvent: vi.fn(), syncToPsychographic: vi.fn(), isSyncing: false,
}) }));

const contact = 'contato-local';
const insight: SocialInsight = {
  id: 'insight-local-a', platform: 'linkedin', insight_type: 'post',
  content: 'Registro sintético de integração autorizado pelo contato.',
  indicator_score: 70, sentiment: 'neutral', created_at: '2026-10-28T10:00:00Z',
};
const denied = { code: '42501', message: 'permission denied for table social_insights' };
let client: QueryClient;
function Wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user = { id: 'usuario-a' };
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const query = { select: mocks.select, eq: mocks.eq, order: mocks.order, limit: mocks.limit };
  for (const method of [mocks.from, mocks.select, mocks.eq, mocks.order]) method.mockReturnValue(query);
  mocks.limit.mockResolvedValue({ data: [insight], error: null });
});
afterEach(() => { cleanup(); client.clear(); });

describe('Histórico social sem dados fabricados', () => {
  it.each([
    { code: '42703', message: 'column social_insights.source_url does not exist' },
    denied,
    new Error('Failed to fetch'),
  ])('propaga a falha em vez de inventar uma biografia: %j', async error => {
    mocks.limit.mockResolvedValue({ data: null, error });
    const { result } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it.each([{ data: [] }, { data: null }])('retorna vazio somente quando a consulta confirma ausência: %j', async ({ data }) => {
    mocks.limit.mockResolvedValue({ data, error: null });
    const { result } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it('propaga uma rejeição de transporte sem gerar registros', async () => {
    const failure = new TypeError('Failed to fetch');
    mocks.limit.mockRejectedValue(failure);
    const { result } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeUndefined();
  });

  it('não repete automaticamente consultas rejeitadas, mesmo com retry global', async () => {
    client.setDefaultOptions({ queries: { retry: 3, retryDelay: 0 } });
    mocks.limit.mockResolvedValue({ data: null, error: denied });
    const { result } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mocks.limit).toHaveBeenCalledTimes(1);
  });

  it('preserva apenas os registros reais e delimita a consulta ao usuário e contato', async () => {
    const { result } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toEqual([insight]));
    expect(mocks.from).toHaveBeenCalledWith('social_insights');
    expect(mocks.eq).toHaveBeenCalledWith('contact_id', contact);
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'usuario-a');
    expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mocks.limit).toHaveBeenCalledWith(100);
  });

  it('não consulta sem identidade, mesmo por refetch manual', async () => {
    mocks.user = null;
    const { result } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    await act(async () => { await result.current.refetch(); });
    expect(mocks.from).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it('não consulta sem contato, mesmo por refetch manual', async () => {
    const { result } = renderHook(() => useSocialInsights(undefined), { wrapper: Wrapper });
    await act(async () => { await result.current.refetch(); });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('não reaproveita o cache de uma conta em outra conta', async () => {
    const { result, rerender } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toEqual([insight]));
    const other = { ...insight, id: 'insight-local-b', content: 'Registro sintético da segunda conta.' };
    mocks.user = { id: 'usuario-b' };
    mocks.limit.mockResolvedValue({ data: [other], error: null });
    rerender();
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toEqual([other]));
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'usuario-b');
  });

  it('não expõe o histórico da sessão encerrada', async () => {
    const { result, rerender } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toEqual([insight]));
    mocks.user = null;
    rerender();
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it('isola uma resposta tardia da conta anterior', async () => {
    let resolveFirst!: (value: { data: SocialInsight[]; error: null }) => void;
    mocks.limit.mockReturnValueOnce(new Promise(resolve => { resolveFirst = resolve; }));
    const { result, rerender } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(mocks.limit).toHaveBeenCalledTimes(1));
    const other = { ...insight, id: 'insight-tardio-b', content: 'Histórico de teste da nova conta.' };
    mocks.user = { id: 'usuario-b' };
    mocks.limit.mockResolvedValue({ data: [other], error: null });
    rerender();
    await waitFor(() => expect(result.current.data).toEqual([other]));
    await act(async () => { resolveFirst({ data: [insight], error: null }); });
    expect(result.current.data).toEqual([other]);
  });

  it('mantém a última resposta válida se a recarga falhar', async () => {
    const { result } = renderHook(() => useSocialInsights(contact), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toEqual([insight]));
    expect(result.current.isRefetchError).toBe(false);
    mocks.limit.mockResolvedValue({ data: null, error: denied });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.isRefetchError).toBe(true));
    expect(result.current.data).toEqual([insight]);
  });
});

describe('Consumidores do histórico social', () => {
  it.each(['painel', 'detalhes'])('distingue erro de vazio e permite nova tentativa: %s', async view => {
    mocks.limit.mockResolvedValue({ data: null, error: denied });
    render(view === 'painel' ? <SocialIntelligencePanel contactId={contact} />
      : <SocialMatchDetails contactId={contact} offerName="Oferta de teste" metadata={{ keywords: ['Registro'] }} />, { wrapper: Wrapper });
    if (view === 'detalhes') fireEvent.click(screen.getByRole('button', { name: /ver detalhes do match/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o histórico social.'));
    expect(screen.queryByText(/permission denied|social_insights|Diretora de Operações/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nenhuma evidência social encontrada/i)).not.toBeInTheDocument();
    mocks.limit.mockResolvedValue({ data: [insight], error: null });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(screen.getByText(insight.content)).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('informa ausência confirmada sem atribuir evidências a uma análise inexistente', async () => {
    mocks.limit.mockResolvedValue({ data: [], error: null });
    render(<SocialMatchDetails contactId={contact} offerName="Oferta sem evidências" metadata={{ keywords: ['teste'] }} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /ver detalhes do match/i }));
    await waitFor(() => expect(screen.getByText('Nenhuma evidência social encontrada para esta oferta.')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/análise semântica/i)).not.toBeInTheDocument();
  });

  it('mantém o histórico visível e informa a falha parcial na recarga do painel', async () => {
    render(<SocialIntelligencePanel contactId={contact} />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText(insight.content)).toBeInTheDocument());
    mocks.limit.mockResolvedValue({ data: null, error: denied });
    await act(async () => { await client.invalidateQueries({ queryKey: ['social-insights-history'] }); });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(insight.content)).toBeInTheDocument();
  });
});
