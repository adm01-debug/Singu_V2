import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocuments } from '../useDocuments';
import { useContactSegmentation } from '../useContactSegmentation';
import { useBehavioralProfilesList } from '../useBehavioralProfilesList';
import { useEmailCampaigns } from '../useEmailCampaigns';

const mocks = vi.hoisted(() => ({
  from: vi.fn(), upload: vi.fn(), signedUrl: vi.fn(), remove: vi.fn(), warning: vi.fn(), error: vi.fn(), success: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: mocks.from,
  storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.signedUrl, remove: mocks.remove }) },
} }));
vi.mock('sonner', () => ({ toast: { warning: mocks.warning, error: mocks.error, success: mocks.success } }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), in: vi.fn(), insert: vi.fn(),
    update: vi.fn(), range: vi.fn(), not: vi.fn(), then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.in, query.insert,
    query.update, query.range, query.not]) method.mockReturnValue(query);
  return query;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue(queryResult([]));
  mocks.upload.mockResolvedValue({ error: null });
  mocks.signedUrl.mockResolvedValue({ data: { signedUrl: 'https://example.invalid/arquivo-assinado' }, error: null });
  mocks.remove.mockResolvedValue({ error: null });
});
afterEach(() => queryClient.clear());

describe('Uploads privados compensam falhas posteriores', () => {
  it.each(['link', 'registro'] as const)('remove o mesmo objeto após falhar no %s', async stage => {
    const failure = new Error('Falha posterior ao upload');
    if (stage === 'link') mocks.signedUrl.mockResolvedValue({ data: null, error: failure });
    else {
      const query = queryResult([]);
      query.insert.mockReturnValue(queryResult(null, failure));
      mocks.from.mockReturnValue(query);
    }
    const { result } = renderHook(() => useDocuments('company', 'empresa-1'), { wrapper });
    await expect(result.current.upload.mutateAsync({ file: new File(['teste'], 'contrato.pdf'), docType: 'contract' })).rejects.toBe(failure);
    expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]]);
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('preserva a falha original e alerta quando a remoção também falha', async () => {
    const failure = new Error('Link indisponível');
    mocks.signedUrl.mockResolvedValue({ data: null, error: failure });
    mocks.remove.mockRejectedValue(new Error('Storage indisponível'));
    const { result } = renderHook(() => useDocuments('company', 'empresa-1'), { wrapper });
    await expect(result.current.upload.mutateAsync({ file: new File(['teste'], 'contrato.pdf'), docType: 'contract' })).rejects.toBe(failure);
    expect(mocks.warning).toHaveBeenCalledWith(expect.stringContaining('não pôde ser removido'));
  });
});

describe('Relações não enviam a carteira inteira na URL', () => {
  const contacts = Array.from({ length: 101 }, (_, index) => ({
    id: `contato-${index}`, full_name: `Nome ${index}`, company_id: `empresa-${index}`, avatar_url: null,
  }));

  it('divide os comportamentos e inclui o último contato na segmentação', async () => {
    const source = queryResult(contacts);
    const first = queryResult([]);
    const last = queryResult([{ contact_id: 'contato-100', disc_primary: 'D' }]);
    let batches = 0;
    mocks.from.mockImplementation((table: string) => table === 'contacts' ? source : batches++ === 0 ? first : last);
    const { result } = renderHook(() => useContactSegmentation(), { wrapper });
    await waitFor(() => expect(result.current.filteredContacts).toHaveLength(101));
    expect(first.in.mock.calls[0][1]).toHaveLength(100);
    expect(last.in).toHaveBeenCalledWith('contact_id', ['contato-100']);
    expect(result.current.filteredContacts[100].disc_primary).toBe('D');
    expect(source.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
  });

  it('divide contatos e empresas dos perfis mantendo o escopo do dono', async () => {
    const profiles = queryResult(contacts.map(contact => ({
      id: `perfil-${contact.id}`, contact_id: contact.id, last_updated_at: '2026-10-11T10:00:00Z',
    })));
    const contactBatches = [queryResult(contacts.slice(0, 100)), queryResult(contacts.slice(100))];
    const companyBatches = [
      queryResult(contacts.slice(0, 100).map(contact => ({ id: contact.company_id, nome_crm: contact.company_id }))),
      queryResult([{ id: 'empresa-100', nome_crm: 'Última empresa' }]),
    ];
    let contactOffset = 0;
    let companyOffset = 0;
    mocks.from.mockImplementation((table: string) => table === 'contact_analytical_profiles' ? profiles
      : table === 'contacts' ? contactBatches[contactOffset++] : companyBatches[companyOffset++]);
    const { result } = renderHook(() => useBehavioralProfilesList({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[100]).toMatchObject({ contact_name: 'Nome 100', company_name: 'Última empresa' });
    for (const batches of [contactBatches, companyBatches]) {
      expect(batches[0].in.mock.calls[0][1]).toHaveLength(100);
      expect(batches[1].in.mock.calls[0][1]).toHaveLength(1);
      for (const batch of batches) expect(batch.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
    }
  });
});

describe('Contagem de campanha não antecipa a gravação', () => {
  it('não atualiza a contagem quando a inserção de destinatários falha', async () => {
    const failure = new Error('Lote recusado');
    const campaign = queryResult([]);
    const recipients = queryResult([]);
    const failedInsert = queryResult(null, failure);
    let recipientCalls = 0;
    mocks.from.mockImplementation((table: string) => table === 'email_campaigns' ? campaign
      : table === 'contacts' ? queryResult([{ id: 'contato-1', email: 'contato@example.invalid' }])
      : recipientCalls++ === 0 ? recipients : failedInsert);
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await expect(result.current.sendCampaign.mutateAsync('campanha-1')).rejects.toBe(failure);
    expect(campaign.update).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.warning).not.toHaveBeenCalled();
  });
});
