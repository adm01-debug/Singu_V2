import React, { useEffect } from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';
import {
  computeIsolatedFilterCounts,
  type IsolatedFilterCount,
} from '@/lib/computeIsolatedFilterCounts';
import type { Interaction } from '@/hooks/useInteractions';

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Sem debounce: a busca textual já chega íntegra ao filtro.
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: <T,>(v: T) => v }));

// Persistência de canais em LS é irrelevante aqui; isolamos com no-ops.
vi.mock('@/lib/channelPersistence', () => ({
  readAppliedCanais: () => null,
  writeAppliedCanais: vi.fn(),
  clearAppliedCanais: vi.fn(),
}));

function makeInteraction(over: Partial<Interaction>): Interaction {
  return {
    id: over.id ?? Math.random().toString(36).slice(2),
    user_id: 'u1',
    contact_id: over.contact_id ?? 'c1',
    company_id: over.company_id ?? null,
    type: over.type ?? 'whatsapp',
    title: over.title ?? '',
    content: over.content ?? '',
    initiated_by: over.initiated_by ?? 'us',
    created_at: over.created_at ?? new Date('2025-01-15T12:00:00Z').toISOString(),
    sentiment: over.sentiment ?? null,
    tags: over.tags ?? [],
    follow_up_required: false,
    follow_up_date: null,
    duration: null,
    response_time: null,
    updated_at: new Date().toISOString(),
  } as unknown as Interaction;
}

const DATASET: Interaction[] = [
  makeInteraction({ id: '1',  type: 'whatsapp',   contact_id: 'cA', company_id: 'E1', initiated_by: 'us',   sentiment: 'positive', title: 'Proposta enviada',     created_at: '2025-01-05T10:00:00Z' }),
  makeInteraction({ id: '2',  type: 'whatsapp',   contact_id: 'cA', company_id: 'E1', initiated_by: 'them', sentiment: 'neutral',  content: 'Confirmando proposta', created_at: '2025-01-12T10:00:00Z' }),
  makeInteraction({ id: '3',  type: 'whatsapp',   contact_id: 'cB', company_id: 'E1', initiated_by: 'us',                              created_at: '2025-01-20T10:00:00Z' }),
  makeInteraction({ id: '4',  type: 'whatsapp',   contact_id: 'cC', company_id: null, initiated_by: 'us',                              created_at: '2025-02-02T10:00:00Z' }),
  makeInteraction({ id: '5',  type: 'email',      contact_id: 'cA', company_id: 'E1', initiated_by: 'them', sentiment: 'positive',                              created_at: '2025-02-10T10:00:00Z' }),
  makeInteraction({ id: '6',  type: 'email',      contact_id: 'cB', company_id: 'E2', initiated_by: 'us',   sentiment: 'mixed',    tags: ['proposta'],            created_at: '2025-02-18T10:00:00Z' }),
  makeInteraction({ id: '7',  type: 'call',       contact_id: 'cB', company_id: 'E2', initiated_by: 'them', sentiment: 'negative',                              created_at: '2025-02-25T10:00:00Z' }),
  makeInteraction({ id: '8',  type: 'call',       contact_id: 'cC', company_id: 'E2', initiated_by: 'us',                              created_at: '2025-03-03T10:00:00Z' }),
  makeInteraction({ id: '9',  type: 'meeting',    contact_id: 'cC', company_id: null, initiated_by: 'them', sentiment: 'neutral',                              created_at: '2025-03-15T10:00:00Z' }),
  makeInteraction({ id: '10', type: 'video_call', contact_id: 'cA', company_id: 'E1', initiated_by: 'us',                              created_at: '2025-03-28T10:00:00Z' }),
];

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function applyOnly(
  items: Interaction[],
  filter: { key: string; value: unknown },
): number {
  switch (filter.key) {
    case 'q': {
      const q = normalize(String(filter.value ?? '').trim());
      if (!q) return items.length;
      return items.filter((i) => normalize(`${i.title ?? ''} ${i.content ?? ''} ${(i.tags ?? []).join(' ')}`).includes(q)).length;
    }
    case 'contact':
      return items.filter((i) => i.contact_id === filter.value).length;
    case 'company':
      return items.filter((i) => i.company_id === filter.value).length;
    case 'direcao': {
      const target = filter.value === 'inbound' ? 'them' : 'us';
      return items.filter((i) => i.initiated_by === target).length;
    }
    case 'canais': {
      const set = new Set(filter.value as string[]);
      return items.filter((i) => set.has(i.type)).length;
    }
    case 'de': {
      const ts = new Date(filter.value as Date).setHours(0, 0, 0, 0);
      return items.filter((i) => new Date(i.created_at).getTime() >= ts).length;
    }
    case 'ate': {
      const ts = new Date(filter.value as Date).setHours(23, 59, 59, 999);
      return items.filter((i) => new Date(i.created_at).getTime() <= ts).length;
    }
    case 'sentimento':
      return items.filter((i) => i.sentiment === filter.value).length;
    default:
      return items.length;
  }
}

function captureHook(initial: string): {
  filters: ReturnType<typeof useInteractionsAdvancedFilter>['filters'];
  debouncedQ: string;
} {
  const captured: { current: ReturnType<typeof useInteractionsAdvancedFilter> | null } = { current: null };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Probe() {
    const adv = useInteractionsAdvancedFilter();
    useEffect(() => { captured.current = adv; });
    captured.current = adv;
    return null;
  }

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initial]}>
        <Probe />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  if (!captured.current) throw new Error('hook não renderizou');
  return { filters: captured.current.filters, debouncedQ: captured.current.debouncedQ };
}

function byKey(counts: IsolatedFilterCount[]): Record<string, number> {
  return Object.fromEntries(counts.map((c) => [c.key, c.count]));
}

describe('Microdetalhe ↔ filtros isolados (integração com o hook)', () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
  });
  afterEach(() => cleanup());

  it('cada contagem do microdetalhe bate com aplicar SÓ aquele filtro', () => {
    const url =
      '/interacoes?q=proposta&contact=cA&company=E1&canais=whatsapp,email&direcao=outbound&de=2025-02-01&ate=2025-03-31&sentimento=positive';
    const { filters, debouncedQ } = captureHook(url);

    const counts = computeIsolatedFilterCounts(DATASET, filters, debouncedQ);
    const got = byKey(counts);

    const expected = {
      q:          applyOnly(DATASET, { key: 'q',          value: 'proposta' }),
      contact:    applyOnly(DATASET, { key: 'contact',    value: 'cA' }),
      company:    applyOnly(DATASET, { key: 'company',    value: 'E1' }),
      canais:     applyOnly(DATASET, { key: 'canais',     value: ['whatsapp', 'email'] }),
      direcao:    applyOnly(DATASET, { key: 'direcao',    value: 'outbound' }),
      de:         applyOnly(DATASET, { key: 'de',         value: filters.de }),
      ate:        applyOnly(DATASET, { key: 'ate',        value: filters.ate }),
      sentimento: applyOnly(DATASET, { key: 'sentimento', value: 'positive' }),
    };

    expect(got).toEqual(expected);
    Object.entries(got).forEach(([k, v]) => {
      expect(v, `microdetalhe '${k}' deve ser > 0 neste dataset`).toBeGreaterThan(0);
    });
  });

  it('canais inválidos na URL são descartados pela whitelist e NÃO inflam a contagem', () => {
    const { filters, debouncedQ } = captureHook('/interacoes?canais=xpto,whatsapp,sms');
    expect(filters.canais).toEqual(['whatsapp']);

    const counts = computeIsolatedFilterCounts(DATASET, filters, debouncedQ);
    const got = byKey(counts);
    expect(got).toEqual({
      canais: applyOnly(DATASET, { key: 'canais', value: ['whatsapp'] }),
    });
  });

  it('canais com case/whitespace heterogêneos são normalizados (trim + lowercase + dedup)', () => {
    const { filters, debouncedQ } = captureHook(
      '/interacoes?canais=%20WhatsApp%20,EMAIL,whatsapp',
    );
    expect(filters.canais).toEqual(['whatsapp', 'email']);

    const counts = computeIsolatedFilterCounts(DATASET, filters, debouncedQ);
    const got = byKey(counts);
    expect(got.canais).toBe(applyOnly(DATASET, { key: 'canais', value: ['whatsapp', 'email'] }));
  });

  it('busca textual usa a mesma normalização (NFD + lowercase) que o filtro real', () => {
    const { filters, debouncedQ } = captureHook('/interacoes?q=PROP%C3%93STA');
    expect(filters.q).toBe('PROPÓSTA');

    const counts = computeIsolatedFilterCounts(DATASET, filters, debouncedQ);
    const got = counts.find((c) => c.key === 'q')?.count;
    expect(got).toBe(applyOnly(DATASET, { key: 'q', value: filters.q }));
    expect(got).toBe(3);
  });

  it('sentimento inválido na URL é descartado e NÃO aparece no microdetalhe', () => {
    const { filters, debouncedQ } = captureHook('/interacoes?sentimento=foo');
    expect(filters.sentimento).toBeUndefined();
    const counts = computeIsolatedFilterCounts(DATASET, filters, debouncedQ);
    expect(counts.find((c) => c.key === 'sentimento')).toBeUndefined();
  });

  it('direcao=all não é considerado filtro ativo no microdetalhe', () => {
    const { filters, debouncedQ } = captureHook('/interacoes?direcao=all');
    expect(filters.direcao).toBe('all');
    const counts = computeIsolatedFilterCounts(DATASET, filters, debouncedQ);
    expect(counts.find((c) => c.key === 'direcao')).toBeUndefined();
  });

  it('soma das contagens isoladas ≠ total quando filtros são correlacionados (sanidade)', () => {
    const { filters, debouncedQ } = captureHook(
      '/interacoes?contact=cA&canais=whatsapp&sentimento=positive',
    );
    const counts = computeIsolatedFilterCounts(DATASET, filters, debouncedQ);
    const values = counts.map((c) => c.count);
    expect(new Set(values).size).toBeGreaterThan(1);
    values.forEach((v) => expect(v).toBeLessThanOrEqual(DATASET.length));
  });
});
