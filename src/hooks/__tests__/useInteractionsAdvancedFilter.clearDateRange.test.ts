import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrapperFor(initial: string) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(MemoryRouter, { initialEntries: [initial] }, children)
    );
}

describe('useInteractionsAdvancedFilter.clearDateRange', () => {
  it('remove `de` e `ate` em uma única operação atômica', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?de=2025-01-01&ate=2025-01-31&q=acme'),
    });

    expect(result.current.filters.de).toBeInstanceOf(Date);
    expect(result.current.filters.ate).toBeInstanceOf(Date);

    let removed: boolean | undefined;
    act(() => { removed = result.current.clearDateRange(); });

    expect(removed).toBe(true);
    expect(result.current.filters.de).toBeUndefined();
    expect(result.current.filters.ate).toBeUndefined();
  });

  it('preserva todos os outros filtros (canais, q, sentimento, sort, page reset)', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor(
        '/interacoes?de=2025-01-01&ate=2025-01-31&q=acme&canais=email,whatsapp&sentimento=positive&sort=oldest&page=3',
      ),
    });

    act(() => { result.current.clearDateRange(); });

    expect(result.current.filters.q).toBe('acme');
    expect(result.current.filters.canais).toEqual(['email', 'whatsapp']);
    expect(result.current.filters.sentimento).toBe('positive');
    expect(result.current.filters.sort).toBe('oldest');
    expect(result.current.filters.page).toBe(1);
  });

  it('é no-op silencioso quando não há datas (retorna false, não escreve URL)', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?q=acme'),
    });

    let removed: boolean | undefined;
    act(() => { removed = result.current.clearDateRange(); });

    expect(removed).toBe(false);
    expect(result.current.filters.q).toBe('acme');
  });

  it('remove só `de` quando só `de` está presente', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?de=2025-01-01'),
    });

    let removed: boolean | undefined;
    act(() => { removed = result.current.clearDateRange(); });

    expect(removed).toBe(true);
    expect(result.current.filters.de).toBeUndefined();
    expect(result.current.filters.ate).toBeUndefined();
  });

  it('remove só `ate` quando só `ate` está presente', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?ate=2025-12-31'),
    });

    act(() => { result.current.clearDateRange(); });

    expect(result.current.filters.de).toBeUndefined();
    expect(result.current.filters.ate).toBeUndefined();
  });
});
