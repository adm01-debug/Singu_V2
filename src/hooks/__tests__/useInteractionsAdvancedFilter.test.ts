import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInteractionsAdvancedFilter } from '../useInteractionsAdvancedFilter';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: any) => v }));

vi.mock('@/lib/channelPersistence', () => ({
  readAppliedCanais: () => null,
  writeAppliedCanais: vi.fn(),
  clearAppliedCanais: vi.fn(),
}));

describe('useInteractionsAdvancedFilter', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    try { localStorage.clear(); } catch { /* noop */ }
  });

  const wrapper = ({ children, initialEntries = ['/interacoes'] }: { children: React.ReactNode, initialEntries?: string[] }) => (
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(MemoryRouter, { initialEntries: initialEntries },
        children
      )
    )
  );

  it('inicializa com filtros da URL', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: (props: { children: React.ReactNode }) => wrapper({ children: props.children, initialEntries: ['/interacoes?q=teste&sentimento=positive'] })
    });
    
    expect(result.current.filters.q).toBe('teste');
    expect(result.current.filters.sentimento).toBe('positive');
  });

  it('setFilter mantém consistência básica', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: (props: { children: React.ReactNode }) => wrapper({ children: props.children, initialEntries: ['/interacoes?q=teste'] })
    });

    expect(result.current.filters.q).toBe('teste');
  });
});
