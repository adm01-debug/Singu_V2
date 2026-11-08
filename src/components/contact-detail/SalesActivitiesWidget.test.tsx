import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SalesActivitiesWidget } from './SalesActivitiesWidget';
import { queryExternalData } from '@/lib/externalData';

vi.mock('@/lib/externalData', () => ({ queryExternalData: vi.fn() }));

it('informa que não existe vínculo com o contato sem consultar atividades por nome', () => {
  render(<SalesActivitiesWidget />);

  expect(screen.getByRole('status')).toHaveTextContent(
    'não possui um vínculo entre atividades de vendas e contatos',
  );
  expect(screen.queryByText('Nenhuma atividade de vendas encontrada')).not.toBeInTheDocument();
  expect(queryExternalData).not.toHaveBeenCalled();
});
