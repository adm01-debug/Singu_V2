import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useImportWhatsAppMessages, useWhatsAppMessages, uploadWhatsAppAudio } from '../useWhatsAppImport';
import { useNpsSurveys } from '../useNpsSurveys';
import { useBehavioralProfilesList } from '../useBehavioralProfilesList';
import { useUnifiedCommunicationHistory } from '../useInteractionsRpc';

const mocks = vi.hoisted(() => ({
  from: vi.fn(), invoke: vi.fn(), upload: vi.fn(), createSignedUrl: vi.fn(), rpc: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: mocks.rpc }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: mocks.from,
  functions: { invoke: mocks.invoke },
  storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.createSignedUrl }) },
} }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), in: vi.fn(), update: vi.fn(), maybeSingle: vi.fn(),
    then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.in, query.update, query.maybeSingle]) {
    method.mockReturnValue(query);
  }
  return query;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const message = {
  id: 'mensagem-1', contact_id: 'contato-1', company_id: null, message_type: 'audio',
  content: null, media_url: 'https://example.invalid/audio', from_me: false, sender_name: 'Contato',
  timestamp: '2026-01-01T00:00:00Z', metadata: { duration_seconds: 12 },
};
const profile = {
  id: 'perfil-1', contact_id: 'contato-1', summary: 'Resumo', tone: 'formal',
  communication_style: null, sentiment_trend: null, preferences: [{ label: 'Email', evidence: 'Mensagem' }],
  hobbies: [], recurrent_topics: ['Compras'], based_on_count: 3, model: 'modelo',
  last_updated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue(queryResult([]));
  mocks.upload.mockResolvedValue({ error: null });
  mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://example.invalid/audio' }, error: null });
});

describe('Contratos canônicos da comunicação WhatsApp', () => {
  it('consulta mensagens e transcrições reais e normaliza os aliases virtuais', async () => {
    const messages = queryResult([message]);
    const transcriptions = queryResult([{
      whatsapp_message_id: message.id, content: 'Áudio transcrito', provider: 'manual', confidence: 0.9,
    }]);
    mocks.from.mockImplementation(table => table === 'whatsapp_messages' ? messages : transcriptions);
    const { result } = renderHook(() => useWhatsAppMessages({ contactId: 'contato-1' }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(messages.select.mock.calls[0][0]).not.toContain('transcription_status');
    expect(messages.select.mock.calls[0][0]).not.toContain('duration_seconds');
    expect(messages.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
    expect(transcriptions.in).toHaveBeenCalledWith('whatsapp_message_id', [message.id]);
    expect(result.current.data?.[0]).toMatchObject({
      duration_seconds: 12, transcription_status: 'done',
      whatsapp_transcriptions: [{ content: 'Áudio transcrito', provider: 'manual', confidence: 0.9 }],
    });
  });

  it('rejeita metadados de duração incompatíveis', async () => {
    mocks.from.mockImplementation(table => queryResult(table === 'whatsapp_messages'
      ? [{ ...message, metadata: { duration_seconds: 'inválido' } }] : []));
    const { result } = renderHook(() => useWhatsAppMessages({ contactId: 'contato-1' }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.name).toBe('ZodError');
    expect(result.current.data).toBeUndefined();
  });

  it('não converte erro da consulta de transcrições em lista vazia', async () => {
    const error = new Error('Falha na transcrição');
    mocks.from.mockImplementation(table => table === 'whatsapp_messages'
      ? queryResult([message]) : queryResult(null, error));
    const { result } = renderHook(() => useWhatsAppMessages({ contactId: 'contato-1' }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });

  it('valida a resposta JSON da importação antes de anunciar sucesso', async () => {
    mocks.invoke.mockResolvedValue({ data: { inserted_count: 'inválido' }, error: null });
    const { result } = renderHook(() => useImportWhatsAppMessages(), { wrapper });
    await expect(result.current.mutateAsync([{ remote_jid: 'contato@s.whatsapp.net' }]))
      .rejects.toMatchObject({ name: 'ZodError' });
  });

  it('propaga a falha real de geração da URL assinada do áudio', async () => {
    const error = new Error('Storage indisponível');
    mocks.createSignedUrl.mockResolvedValue({ data: null, error });
    await expect(uploadWhatsAppAudio(new File(['teste'], 'audio.ogg', { type: 'audio/ogg' }), 'usuario-1'))
      .rejects.toBe(error);
  });
});

describe('Histórico de contatos não envia argumento inexistente à RPC empresarial', () => {
  it.each([
    { type: null, channel: 'whatsapp', expected: 'whatsapp' },
    { type: null, channel: null, expected: 'note' },
    { type: 'call', channel: null, expected: 'call' },
  ])('normaliza tipo e canal nulos sem perder a interação: %j', async ({ type, channel, expected }) => {
    mocks.from.mockReturnValue(queryResult([{
      id: 'interacao-1', company_id: null, contact_id: 'contato-1', type, channel,
      resumo: 'Conversa', content: null, data_interacao: '2026-01-01T00:00:00Z',
    }]));
    const { result } = renderHook(() => useUnifiedCommunicationHistory('contato-1', 50, 'contact'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({ id: 'interacao-1', type: expected, channel: expected });
  });

  it('consulta o contato com os mesmos campos reais utilizados pela RPC de empresa', async () => {
    const query = queryResult([{
      id: 'interacao-1', company_id: 'empresa-1', contact_id: 'contato-1', type: 'call', channel: 'phone',
      resumo: null, content: 'Conteúdo', data_interacao: '2026-01-01T00:00:00Z',
    }]);
    mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useUnifiedCommunicationHistory('contato-1', 50, 'contact'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith('contact_id', 'contato-1');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
    expect(result.current.data?.[0]).toMatchObject({
      id: 'interacao-1', contact_id: 'contato-1', company_id: 'empresa-1', resumo: 'Conteúdo',
      data_interacao: '2026-01-01T00:00:00Z',
    });
  });

  it('propaga erro da consulta de contato sem produzir histórico vazio bem-sucedido', async () => {
    const error = new Error('Falha no histórico do contato');
    mocks.from.mockReturnValue(queryResult(null, error));
    const { result } = renderHook(() => useUnifiedCommunicationHistory('contato-1', 50, 'contact'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});

describe('Notas NPS usam o campo canônico separado da nota CSAT', () => {
  it('consulta somente pesquisas NPS e usa o alias da nota real', async () => {
    const query = queryResult([]);
    mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useNpsSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(query.select.mock.calls[0][0]).toContain('score:nps_score');
    expect(query.eq).toHaveBeenCalledWith('survey_type', 'nps');
  });

  it('permite nota 10 sem gravá-la no campo CSAT restrito a 1–5', async () => {
    const query = queryResult([]);
    query.maybeSingle.mockResolvedValue({ data: { id: 'pesquisa-1' }, error: null });
    mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useNpsSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.answerSurvey({ id: 'pesquisa-1', score: 10 });
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ nps_score: 10 }));
    expect(query.update.mock.calls[0][0]).not.toHaveProperty('score');
  });

  it('rejeita notas fora de 0–10 antes da escrita', async () => {
    const query = queryResult([]);
    mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useNpsSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(result.current.answerSurvey({ id: 'pesquisa-1', score: 11 })).rejects.toThrow('entre 0 e 10');
    expect(query.update).not.toHaveBeenCalled();
  });
});

describe('Perfis comportamentais usam relações e JSON reais', () => {
  it('aceita as strings do analisador social junto dos objetos com evidência', async () => {
    mocks.from.mockImplementation(table => queryResult(table === 'contact_analytical_profiles'
      ? [{ ...profile, preferences: ['Email', ...profile.preferences], hobbies: ['Leitura'] }] : []));
    const { result } = renderHook(() => useBehavioralProfilesList({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({
      preferences: [{ label: 'Email' }, { label: 'Email', evidence: 'Mensagem' }], hobbies: [{ label: 'Leitura' }],
    });
  });

  it('normaliza nomes a partir de full_name e nome_crm sem relação inexistente', async () => {
    const profiles = queryResult([profile]);
    const contacts = queryResult([{ id: 'contato-1', full_name: 'Nome Completo', avatar_url: null, company_id: 'empresa-1' }]);
    const companies = queryResult([{ id: 'empresa-1', nome_crm: 'Empresa Canônica' }]);
    mocks.from.mockImplementation(table => table === 'contact_analytical_profiles' ? profiles : table === 'contacts' ? contacts : companies);
    const { result } = renderHook(() => useBehavioralProfilesList({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(profiles.select.mock.calls[0][0]).not.toContain('contacts:');
    expect(contacts.select).toHaveBeenCalledWith('id, full_name, avatar_url, company_id');
    expect(companies.select).toHaveBeenCalledWith('id, nome_crm');
    expect(result.current.data?.[0]).toMatchObject({
      contact_name: 'Nome Completo', company_name: 'Empresa Canônica', preferences: profile.preferences,
    });
  });

  it('rejeita itens de preferências inválidos em vez de atribuir um tipo fictício', async () => {
    mocks.from.mockImplementation(table => queryResult(table === 'contact_analytical_profiles'
      ? [{ ...profile, preferences: [17] }] : []));
    const { result } = renderHook(() => useBehavioralProfilesList({}), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.name).toBe('ZodError');
    expect(result.current.data).toBeUndefined();
  });
});
