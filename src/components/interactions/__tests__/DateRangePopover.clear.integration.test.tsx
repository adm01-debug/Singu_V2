import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DateRangePopover } from '@/components/interactions/DateRangePopover';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';

/**
 * Teste de INTEGRAÇÃO: garante que o clique em "Limpar período" no
 * DateRangePopover, plugado no hook real `useInteractionsAdvancedFilter`,
 * remove APENAS `de` e `ate` da URL (via clearDateRange atômico) e preserva
 * todos os outros parâmetros — q, contact (pessoa), company (empresa) e canais.
 *
 * Cobre o caminho ponta a ponta: clique → handleClear → clearRange →
 * clearDateRange → setSearchParams → URL atualizada em uma única operação.
 */

// Harness: renderiza o popover ligado ao hook real e expõe os searchParams
// atuais num <pre data-testid="sp"> para inspeção pelos testes.
function Harness() {
  const { filters, applyDateRange, clearDateRange } = useInteractionsAdvancedFilter();
  const [sp] = useSearchParams();
  return (
    <div>
      <pre data-testid="sp">{sp.toString()}</pre>
      <DateRangePopover
        de={filters.de}
        ate={filters.ate}
        applyDateRange={applyDateRange}
        clearDateRange={clearDateRange}
      />
    </div>
  );
}

function renderWith(initialUrl: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Harness />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function getParams(): URLSearchParams {
  return new URLSearchParams(screen.getByTestId('sp').textContent || '');
}

async function openPopoverAndClickLimpar() {
  // Abre o popover clicando no trigger ("Período" ou rótulo da data).
  const trigger = screen.getByRole('button', { name: /período|a partir de|até/i });
  await act(async () => { fireEvent.click(trigger); });
  // O X inline (svg) e o botão "Limpar período" do popover compartilham o
  // mesmo aria-label. Filtramos pelo button cujo texto começa com "Limpar".
  const buttons = await screen.findAllByRole('button', { name: /limpar período/i });
  const limpar = buttons.find(b => /^limpar período$/i.test((b.textContent || '').trim()));
  if (!limpar) throw new Error('Botão "Limpar período" não encontrado dentro do popover');
  await act(async () => { fireEvent.click(limpar); });
}

describe('DateRangePopover › Limpar período (integração com URL/hook)', () => {
  it('remove `de` e `ate` da URL e preserva q, contact, company e canais', async () => {
    renderWith(
      '/interacoes?de=2025-01-01&ate=2025-01-31&q=acme&contact=c-123&company=co-456&canais=email,whatsapp',
    );

    // Sanidade: range ativo e demais parâmetros presentes.
    let p = getParams();
    expect(p.get('de')).toBe('2025-01-01');
    expect(p.get('ate')).toBe('2025-01-31');
    expect(p.get('q')).toBe('acme');
    expect(p.get('contact')).toBe('c-123');
    expect(p.get('company')).toBe('co-456');
    expect(p.get('canais')).toBe('email,whatsapp');

    await openPopoverAndClickLimpar();

    p = getParams();
    // Datas removidas
    expect(p.has('de')).toBe(false);
    expect(p.has('ate')).toBe(false);
    // Demais filtros preservados intactos
    expect(p.get('q')).toBe('acme');
    expect(p.get('contact')).toBe('c-123');
    expect(p.get('company')).toBe('co-456');
    expect(p.get('canais')).toBe('email,whatsapp');
  });

  it('remove apenas `de` quando só `de` está presente, mantendo q/contact/company/canais', async () => {
    renderWith(
      '/interacoes?de=2025-02-10&q=foo&contact=c-1&company=co-1&canais=sms',
    );

    await openPopoverAndClickLimpar();

    const p = getParams();
    expect(p.has('de')).toBe(false);
    expect(p.has('ate')).toBe(false);
    expect(p.get('q')).toBe('foo');
    expect(p.get('contact')).toBe('c-1');
    expect(p.get('company')).toBe('co-1');
    expect(p.get('canais')).toBe('sms');
  });

  it('remove apenas `ate` quando só `ate` está presente, mantendo demais filtros', async () => {
    renderWith(
      '/interacoes?ate=2025-12-31&q=bar&contact=c-2&company=co-2&canais=email',
    );

    await openPopoverAndClickLimpar();

    const p = getParams();
    expect(p.has('de')).toBe(false);
    expect(p.has('ate')).toBe(false);
    expect(p.get('q')).toBe('bar');
    expect(p.get('contact')).toBe('c-2');
    expect(p.get('company')).toBe('co-2');
    expect(p.get('canais')).toBe('email');
  });

  it('zera o `page` ao limpar datas (efeito esperado de qualquer mudança de filtro), preservando o restante', async () => {
    renderWith(
      '/interacoes?de=2025-01-01&ate=2025-01-31&q=acme&canais=email&page=4',
    );

    await openPopoverAndClickLimpar();

    const p = getParams();
    expect(p.has('de')).toBe(false);
    expect(p.has('ate')).toBe(false);
    // page é removido (volta a 1 por default no hook)
    expect(p.has('page')).toBe(false);
    // Demais preservados
    expect(p.get('q')).toBe('acme');
    expect(p.get('canais')).toBe('email');
  });
});
