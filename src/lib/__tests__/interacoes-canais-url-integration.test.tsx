import React, { useEffect } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';
import { ActiveFiltersBar } from '@/components/interactions/ActiveFiltersBar';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (v: any) => v,
}));

vi.mock('@/lib/channelPersistence', () => ({
  readAppliedCanais: () => null,
  writeAppliedCanais: vi.fn(),
  clearAppliedCanais: vi.fn(),
}));

function Harness({ onReady }: { onReady?: (api: any) => void }) {
  const adv = useInteractionsAdvancedFilter();
  const location = useLocation();
  useEffect(() => { onReady?.(adv); }, [adv, onReady]);
  return React.createElement('div', null,
    React.createElement('div', { 'data-testid': 'url-search' }, location.search),
    React.createElement('div', { 'data-testid': 'canais-count' }, adv.filters.canais.length),
    React.createElement('div', { 'data-testid': 'canais-csv' }, adv.filters.canais.join(',')),
    React.createElement(ActiveFiltersBar, {
      filters: adv.filters,
      setFilter: adv.setFilter,
      clear: adv.clear,
      activeCount: adv.activeCount,
      totalCount: 100,
      visibleCount: 100,
    })
  );
}

function renderAt(initial: string) {
  return render(
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(MemoryRouter, { initialEntries: [initial] },
        React.createElement(Harness)
      )
    )
  );
}

function getRemoveButtonForChip(label: string): HTMLButtonElement {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[aria-label="Remove"]'),
  );
  const match = buttons.find((btn) => btn.parentElement?.textContent?.trim() === label);
  if (!match) {
    throw new Error(`Botão "Remove" do chip "${label}" não encontrado entre ${buttons.length} botões`);
  }
  return match;
}

describe('integração /interacoes ?canais= ↔ chips', () => {
  it('hidrata filters.canais a partir da URL preservando ordem e whitelist', () => {
    renderAt('/interacoes?canais=email,call,whatsapp');
    expect(screen.getByTestId('canais-csv').textContent).toBe('email,call,whatsapp');
    expect(screen.getByTestId('canais-count').textContent).toBe('3');
    expect(screen.getAllByText('Email').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ligação').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('WhatsApp').length).toBeGreaterThanOrEqual(1);
    expect(document.querySelectorAll('button[aria-label="Remove"]')).toHaveLength(3);
  });

  it('remove um canal via clique no X do chip e mantém os demais na URL', async () => {
    const user = userEvent.setup();
    renderAt('/interacoes?canais=email,call,whatsapp');

    await user.click(getRemoveButtonForChip('Email'));

    expect(screen.getByTestId('canais-csv').textContent).toBe('call,whatsapp');
    expect(screen.getByTestId('canais-count').textContent).toBe('2');
    expect(screen.getByTestId('url-search').textContent).toContain('canais=call%2Cwhatsapp');
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(document.querySelectorAll('button[aria-label="Remove"]')).toHaveLength(2);
  });

  it('remover o ÚLTIMO canal apaga o param ?canais= da URL', async () => {
    const user = userEvent.setup();
    renderAt('/interacoes?canais=email');

    expect(screen.getByTestId('canais-count').textContent).toBe('1');
    expect(screen.getByTestId('url-search').textContent).toContain('canais=email');

    await user.click(getRemoveButtonForChip('Email'));

    expect(screen.getByTestId('canais-count').textContent).toBe('0');
    expect(screen.getByTestId('canais-csv').textContent).toBe('');
    expect(screen.getByTestId('url-search').textContent).not.toContain('canais=');
  });

  it('alterna chips em sequência e termina sem ?canais= quando esvaziado', async () => {
    const user = userEvent.setup();
    renderAt('/interacoes?canais=email,call,whatsapp');

    await user.click(getRemoveButtonForChip('WhatsApp'));
    expect(screen.getByTestId('canais-csv').textContent).toBe('email,call');

    await user.click(getRemoveButtonForChip('Email'));
    expect(screen.getByTestId('canais-csv').textContent).toBe('call');
    expect(screen.getByTestId('url-search').textContent).toContain('canais=call');

    await user.click(getRemoveButtonForChip('Ligação'));
    expect(screen.getByTestId('canais-count').textContent).toBe('0');
    expect(screen.getByTestId('url-search').textContent).not.toContain('canais=');
  });

  it('descarta valores fora da whitelist mas mantém os válidos', () => {
    renderAt('/interacoes?canais=email,garbage,CALL');
    expect(screen.getByTestId('canais-csv').textContent).toBe('email,call');
    expect(screen.getByTestId('canais-count').textContent).toBe('2');
  });

  it('setFilter("canais", []) programaticamente também limpa o param', () => {
    let api: any = null;
    render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(MemoryRouter, { initialEntries: ['/interacoes?canais=email,call'] },
          React.createElement(Harness, { onReady: (a) => { api = a; } })
        )
      )
    );

    expect(screen.getByTestId('canais-count').textContent).toBe('2');
    act(() => { api!.setFilter('canais', []); });
    expect(screen.getByTestId('canais-count').textContent).toBe('0');
    expect(screen.getByTestId('url-search').textContent).not.toContain('canais=');
  });
});
