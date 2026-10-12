import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { queryExternalData } from '@/lib/externalData';
import { CompanyCommercialTab } from './CompanyCommercialTab';

vi.mock('@/lib/externalData', () => ({ queryExternalData: vi.fn() }));

describe('Contrato comercial de empresa', () => {
  it('sinaliza o vínculo ausente sem consultar atividades por coluna inexistente', async () => {
    vi.mocked(queryExternalData).mockResolvedValue({ data: [], error: null, count: 0 });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <CompanyCommercialTab companyId="empresa-do-usuario" />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('não possui um vínculo entre atividades de vendas e empresas');
    expect(screen.queryByText('Nenhuma atividade de vendas registrada')).not.toBeInTheDocument();
    await waitFor(() => expect(queryExternalData).toHaveBeenCalledTimes(4));
    expect(vi.mocked(queryExternalData).mock.calls.map(([query]) => query.table))
      .toEqual(['deals', 'proposals', 'meetings', 'tasks']);
    client.clear();
  });
});
