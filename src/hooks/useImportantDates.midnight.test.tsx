import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contact, Interaction } from '@/types';
import { useImportantDates } from './useImportantDates';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
const contact: Contact = {
  id: 'contato-1', companyId: '', companyName: '', firstName: 'Ana', lastName: 'Silva',
  role: 'contact', roleTitle: '', tags: [], hobbies: [], interests: [],
  relationshipStage: 'unknown', relationshipScore: 0, interactionCount: 0, sentiment: 'neutral',
  lifeEvents: [], createdAt: parseISO('2020-01-01'), updatedAt: parseISO('2020-01-01'), birthday: parseISO('1990-01-01'),
  behavior: {
    discProfile: null, discConfidence: 0, preferredChannel: 'email', formalityLevel: 3,
    decisionCriteria: [], needsApproval: false, decisionPower: 5, supportLevel: 5,
    influencedByIds: [], influencesIds: [], currentChallenges: [], competitorsUsed: [],
  },
};
const contacts = [contact];
const interactions: Interaction[] = [];
let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(parseISO('2026-12-31T23:59:59'));
  cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false } } });
  cache.setQueryData(['all-life-events', 'usuario-1'], []);
  cache.setQueryData(['all-relatives', 'usuario-1'], []);
});
afterEach(() => { cleanup(); cache.clear(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('calendário com as mesmas referências após mudança de dia', () => {
  it('recalcula amanhã, hoje e o próximo ano por timer sem remontar', () => {
    const { result, unmount } = renderHook(() => useImportantDates(contacts, interactions), { wrapper });
    expect(result.current.allDates[0].daysUntil).toBe(1);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.today[0]).toMatchObject({ id: 'birthday-contato-1', daysUntil: 0 });
    act(() => { vi.advanceTimersByTime(24 * 60 * 60 * 1000); });
    expect(result.current.today).toHaveLength(0);
    expect(result.current.allDates[0].daysUntil).toBe(364);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['focus', 'visibilitychange'])('recalcula ao retomar uma aba suspensa por %s', event => {
    const timeout = vi.spyOn(globalThis, 'setTimeout');
    const { result } = renderHook(() => useImportantDates(contacts, interactions), { wrapper });
    expect(result.current.allDates[0].daysUntil).toBe(1);
    vi.setSystemTime(parseISO('2027-01-01T08:00:00'));
    act(() => { (event === 'focus' ? window : document).dispatchEvent(new Event(event)); });
    expect(result.current.today[0]?.daysUntil).toBe(0);
    expect(timeout).toHaveBeenCalledWith(expect.any(Function), 16 * 60 * 60 * 1000);
  });
});
