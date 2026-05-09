import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';

const DE_KEY = 'singu-interactions-de-v1';
const ATE_KEY = 'singu-interactions-ate-v1';
const Q_KEY = 'singu-interactions-q-v1';
const CONTACT_KEY = 'singu-interactions-contact-v1';
const COMPANY_KEY = 'singu-interactions-company-v1';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrapperFor(initial: string) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(MemoryRouter, { initialEntries: [initial] }, children)
    );
}

describe('useInteractionsAdvancedFilter › persistência do intervalo de datas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('escreve `de` e `ate` no localStorage quando aplicados', async () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });

    act(() => {
      result.current.applyDateRange(new Date('2025-03-01T12:00:00'), new Date('2025-03-31T12:00:00'));
    });

    await act(async () => { await Promise.resolve(); });

    expect(localStorage.getItem(DE_KEY)).toBe('2025-03-01');
    expect(localStorage.getItem(ATE_KEY)).toBe('2025-03-31');
  });

  it('restaura `de`/`ate` do localStorage no mount quando a URL não os tem, preservando q/contact/company da URL', async () => {
    localStorage.setItem(DE_KEY, '2025-04-01');
    localStorage.setItem(ATE_KEY, '2025-04-30');
    localStorage.setItem(Q_KEY, 'foo');
    localStorage.setItem(CONTACT_KEY, 'c-99');
    localStorage.setItem(COMPANY_KEY, 'co-99');

    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });

    await act(async () => { await Promise.resolve(); });

    expect(result.current.filters.de).toBeInstanceOf(Date);
    expect(result.current.filters.ate).toBeInstanceOf(Date);
    expect((result.current.filters.de as Date).toISOString().slice(0, 10)).toBe('2025-04-01');
    expect((result.current.filters.ate as Date).toISOString().slice(0, 10)).toBe('2025-04-30');
    expect(result.current.filters.q).toBe('foo');
    expect(result.current.filters.contact).toBe('c-99');
    expect(result.current.filters.company).toBe('co-99');
  });

  it('URL ganha sobre LS: se a URL traz `de`/`ate`, o LS é ignorado na hidratação', async () => {
    localStorage.setItem(DE_KEY, '2025-04-01');
    localStorage.setItem(ATE_KEY, '2025-04-30');

    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?de=2025-06-15&ate=2025-06-20'),
    });

    await act(async () => { await Promise.resolve(); });

    expect((result.current.filters.de as Date).toISOString().slice(0, 10)).toBe('2025-06-15');
    expect((result.current.filters.ate as Date).toISOString().slice(0, 10)).toBe('2025-06-20');
  });

  it('preserva canais/q/contact/company na URL ao restaurar datas do LS', async () => {
    localStorage.setItem(DE_KEY, '2025-05-01');
    localStorage.setItem(ATE_KEY, '2025-05-31');

    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?q=acme&contact=c-1&company=co-1&canais=email,whatsapp'),
    });

    await act(async () => { await Promise.resolve(); });

    expect((result.current.filters.de as Date).toISOString().slice(0, 10)).toBe('2025-05-01');
    expect((result.current.filters.ate as Date).toISOString().slice(0, 10)).toBe('2025-05-31');
    expect(result.current.filters.q).toBe('acme');
    expect(result.current.filters.contact).toBe('c-1');
    expect(result.current.filters.company).toBe('co-1');
    expect(result.current.filters.canais).toEqual(['email', 'whatsapp']);
  });

  it('clearDateRange remove `de`/`ate` do localStorage (via espelho reativo)', async () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?de=2025-01-01&ate=2025-01-31&q=acme'),
    });

    await act(async () => { await Promise.resolve(); });
    expect(localStorage.getItem(DE_KEY)).toBe('2025-01-01');
    expect(localStorage.getItem(ATE_KEY)).toBe('2025-01-31');

    act(() => { result.current.clearDateRange(); });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.filters.de).toBeUndefined();
    expect(result.current.filters.ate).toBeUndefined();
    expect(localStorage.getItem(DE_KEY)).toBeNull();
    expect(localStorage.getItem(ATE_KEY)).toBeNull();
    expect(result.current.filters.q).toBe('acme');
  });

  it('valores inválidos no LS são ignorados silenciosamente (não quebram o hook)', async () => {
    localStorage.setItem(DE_KEY, 'data-invalida');
    localStorage.setItem(ATE_KEY, '2025-13-99');

    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });

    await act(async () => { await Promise.resolve(); });

    expect(result.current.filters.de).toBeUndefined();
    expect(result.current.filters.ate).toBeUndefined();
  });
});
