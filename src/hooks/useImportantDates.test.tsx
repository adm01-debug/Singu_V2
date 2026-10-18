import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import type { PropsWithChildren } from 'react';
import type { Contact, Interaction } from '@/types';
import { useImportantDates } from './useImportantDates';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));

const contact: Contact = {
  id: 'contato-1', companyId: '', companyName: '', firstName: 'Ana', lastName: 'Silva',
  role: 'contact', roleTitle: '', tags: [], hobbies: [], interests: [],
  relationshipStage: 'unknown', relationshipScore: 0, interactionCount: 0, sentiment: 'neutral',
  lifeEvents: [], createdAt: parseISO('2020-01-01'), updatedAt: parseISO('2020-01-01'),
  behavior: {
    discProfile: null, discConfidence: 0, preferredChannel: 'email', formalityLevel: 3,
    decisionCriteria: [], needsApproval: false, decisionPower: 5, supportLevel: 5,
    influencedByIds: [], influencesIds: [], currentChallenges: [], competitorsUsed: [],
  },
};

let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={cache}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(parseISO('2026-10-18T18:30:00'));
  cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  cache.setQueryData(['all-life-events', 'usuario-1'], []);
  cache.setQueryData(['all-relatives', 'usuario-1'], []);
});

afterEach(() => {
  cleanup();
  cache.clear();
  vi.useRealTimers();
});

describe('datas importantes respeitam o dia local', () => {
  it.each([
    ['1990-10-18', '2026-10-18', 0, 'today'],
    ['1990-10-19', '2026-10-19', 1, 'urgent'],
    ['1990-10-17', '2027-10-17', 364, 'future'],
  ])('aniversário em %s ocorre em %s (%i dias)', (birthday, expectedDate, daysUntil, urgency) => {
    const { result } = renderHook(() => useImportantDates([{ ...contact, birthday: parseISO(birthday) }], []), { wrapper });
    const event = result.current.allDates[0];
    expect(event).toMatchObject({
      contactId: 'contato-1', contactName: 'Ana Silva', title: 'Aniversário de Ana', daysUntil, urgency,
    });
    expect(format(event.date, 'yyyy-MM-dd')).toBe(expectedDate);
    expect(result.current.today).toHaveLength(daysUntil === 0 ? 1 : 0);
  });

  it('mantém eventos recorrentes de hoje e distingue ontem e amanhã', () => {
    cache.setQueryData(['all-life-events', 'usuario-1'], [
      { id: 'ontem', contact_id: contact.id, event_date: '2026-10-17', title: 'Ontem', recurring: false },
      { id: 'hoje', contact_id: contact.id, event_date: '2020-10-18', title: 'Hoje', recurring: true },
      { id: 'amanha', contact_id: contact.id, event_date: '2026-10-19', title: 'Amanhã', recurring: false },
    ]);
    const { result } = renderHook(() => useImportantDates([contact], []), { wrapper });
    expect(result.current.allDates).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'event-ontem', daysUntil: -1, urgency: 'overdue', isPast: true }),
      expect.objectContaining({ id: 'event-hoje', daysUntil: 0, urgency: 'today', isPast: false }),
      expect.objectContaining({ id: 'event-amanha', daysUntil: 1, urgency: 'urgent', isPast: false }),
    ]));
  });

  it('preserva o dia do aniversário de um familiar', () => {
    cache.setQueryData(['all-relatives', 'usuario-1'], [
      { id: 'familiar-1', contact_id: contact.id, name: 'Bruno', birthday: '2010-10-19', relationship_type: 'filho' },
    ]);
    const { result } = renderHook(() => useImportantDates([contact], []), { wrapper });
    expect(result.current.allDates[0]).toMatchObject({
      title: 'Aniversário de Bruno (filho)', daysUntil: 1, urgency: 'urgent',
    });
    expect(format(result.current.allDates[0].date, 'yyyy-MM-dd')).toBe('2026-10-19');
  });

  it('comemora hoje o relacionamento iniciado no mesmo dia em outro ano', () => {
    const interaction: Interaction = {
      id: 'interacao-1', contactId: contact.id, companyId: '', type: 'email', title: 'Primeiro contato',
      content: '', sentiment: 'neutral', tags: [], initiatedBy: 'us', keyInsights: [],
      followUpRequired: false, createdAt: parseISO('2020-10-18T08:00:00'),
    };
    const { result } = renderHook(() => useImportantDates([contact], [interaction]), { wrapper });
    expect(result.current.today[0]).toMatchObject({ type: 'anniversary', daysUntil: 0, urgency: 'today' });
    expect(format(result.current.today[0].date, 'yyyy-MM-dd')).toBe('2026-10-18');
  });

  it('conta amanhã corretamente na virada do ano', () => {
    vi.setSystemTime(parseISO('2026-12-31T23:30:00'));
    const { result } = renderHook(() => useImportantDates([{ ...contact, birthday: parseISO('1990-01-01') }], []), { wrapper });
    expect(result.current.allDates[0]).toMatchObject({ daysUntil: 1, urgency: 'urgent' });
    expect(format(result.current.allDates[0].date, 'yyyy-MM-dd')).toBe('2027-01-01');
  });
});
