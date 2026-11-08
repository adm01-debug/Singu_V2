import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryExternalData } from '@/lib/externalData';
import { CompanyErpProposalsWidget } from './CompanyErpProposalsWidget';

vi.mock('@/lib/externalData', () => ({ queryExternalData: vi.fn() }));

function renderWidget() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter><CompanyErpProposalsWidget companyId="empresa-do-usuario" /></MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

describe('Propostas ERP da empresa', () => {
  beforeEach(() => vi.mocked(queryExternalData).mockReset());

  it('propaga a falha de todas as origens e recupera os dados ao repetir', async () => {
    vi.mocked(queryExternalData).mockResolvedValue({ data: null, count: null, error: new Error('Invalid table') });
    const client = renderWidget();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível consultar');
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
    expect(screen.queryByText('Nenhuma proposta no ERP.')).not.toBeInTheDocument();
    expect(vi.mocked(queryExternalData).mock.calls.map(([query]) => query.table))
      .toEqual(['vw_propostas', 'propostas', 'vw_proposals']);
    expect(vi.mocked(queryExternalData).mock.calls.every(([query]) =>
      query.filters?.[0]?.column === 'cliente_id' && query.filters[0].value === 'empresa-do-usuario',
    )).toBe(true);

    vi.mocked(queryExternalData).mockResolvedValue({ data: [{ id: 'proposta', numero: 'ERP-001' }], count: 1, error: null });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('ERP-001')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    client.clear();
  });

  it('confirma ausência somente após uma consulta bem-sucedida, inclusive no fallback', async () => {
    vi.mocked(queryExternalData)
      .mockResolvedValueOnce({ data: null, count: null, error: new Error('Invalid table') })
      .mockResolvedValueOnce({ data: [], count: 0, error: null });
    const client = renderWidget();
    expect(await screen.findByText('Nenhuma proposta no ERP.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(queryExternalData).toHaveBeenCalledTimes(2);
    client.clear();
  });
});
