import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationBar } from '@/components/interactions/PaginationBar';

describe('PaginationBar', () => {
  it('não renderiza quando total <= perPage', () => {
    const { container } = render(
      <PaginationBar page={1} perPage={25} total={10} onPageChange={() => {}} onPerPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('não renderiza quando total === 0', () => {
    const { container } = render(
      <PaginationBar page={1} perPage={25} total={0} onPageChange={() => {}} onPerPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('botão Anterior desabilitado em page=1', () => {
    render(
      <PaginationBar page={1} perPage={25} total={300} onPageChange={() => {}} onPerPageChange={() => {}} />
    );
    expect(screen.getByLabelText('Página anterior')).toBeDisabled();
    expect(screen.getByLabelText('Próxima página')).not.toBeDisabled();
  });

  it('botão Próxima desabilitado na última página', () => {
    render(
      <PaginationBar page={12} perPage={25} total={300} onPageChange={() => {}} onPerPageChange={() => {}} />
    );
    expect(screen.getByLabelText('Próxima página')).toBeDisabled();
    expect(screen.getByLabelText('Página anterior')).not.toBeDisabled();
  });

  it('aria-current="page" no botão ativo', () => {
    render(
      <PaginationBar page={5} perPage={25} total={300} onPageChange={() => {}} onPerPageChange={() => {}} />
    );
    const active = screen.getByLabelText('Ir para página 5');
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('chama onPageChange ao clicar em página numerada', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationBar page={5} perPage={25} total={300} onPageChange={onPageChange} onPerPageChange={() => {}} />
    );
    fireEvent.click(screen.getByLabelText('Ir para página 6'));
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it('mostra elipses para totais grandes', () => {
    render(
      <PaginationBar page={6} perPage={25} total={300} onPageChange={() => {}} onPerPageChange={() => {}} />
    );
    // 300/25 = 12 páginas. Janela: 1, ..., 5, 6, 7, ..., 12 → 2 elipses.
    const ellipses = screen.getAllByText('…');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it('exibe contagem "start–end de total"', () => {
    render(
      <PaginationBar page={2} perPage={25} total={120} onPageChange={() => {}} onPerPageChange={() => {}} />
    );
    expect(screen.getByText('26–50')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });
});
