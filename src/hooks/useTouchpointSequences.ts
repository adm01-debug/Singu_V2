import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { queryExternalData } from '@/lib/externalData';

export type SeqChannel = 'whatsapp' | 'email' | 'call' | 'meeting';
export const SEQ_CHANNELS: SeqChannel[] = ['whatsapp', 'email', 'call', 'meeting'];

export interface SequenceStat {
  sequence: SeqChannel[];
  key: string;
  totalDeals: number;
  won: number;
  lost: number;
  winRate: number; // 0-100
  avgTicket: number | null;
}

export interface TouchpointSequencesResult {
  byLength: Record<number, SequenceStat[]>;
  totalClosedDeals: number;
  topInsight: SequenceStat | null;
}

interface RawInteraction {
  id: string;
  type: string | null;
  contact_id: string | null;
  created_at: string;
}

interface RawDeal {
  id: string;
  contact_id: string | null;
  status?: string | null;
  pipeline_stage?: string | null;
  valor?: number | null;
  closed_at?: string | null;
  updated_at?: string | null;
  created_at: string;
}

function normalizeChannel(t: string | null): SeqChannel | null {
  if (!t) return null;
  const s = t.toLowerCase();
  if (s.includes('whats')) return 'whatsapp';
  if (s.includes('email') || s.includes('mail')) return 'email';
  if (s.includes('call') || s.includes('ligaca') || s.includes('telefon') || s.includes('voip')) return 'call';
  if (s.includes('meet') || s.includes('reuni') || s.includes('visit')) return 'meeting';
  return null;
}

function dealOutcome(d: RawDeal): 'won' | 'lost' | null {
  const s = (d.status ?? d.pipeline_stage ?? '').toLowerCase();
  if (!s) return null;
  if (s.includes('won') || s.includes('ganho') || s.includes('fech')) return 'won';
  if (s.includes('lost') || s.includes('perd')) return 'lost';
  return null;
}

export function useTouchpointSequences() {
  const { user } = useAuth();
  return useQuery<TouchpointSequencesResult>({
    queryKey: ['touchpoint-sequences', user?.id],
    enabled: !!user,
    // eslint-disable-next-line sonarjs/cognitive-complexity
    queryFn: async () => {
      const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      const empty: TouchpointSequencesResult = { byLength: { 2: [], 3: [], 4: [], 5: [] }, totalClosedDeals: 0, topInsight: null };
      if (!user) return empty;

      const [{ data: interactions }, dealsRes] = await Promise.all([
        supabase.from('interactions')
          .select('id, type, contact_id, created_at')
          .eq('user_id', user.id)
          .gte('created_at', since)
          .order('created_at', { ascending: true })
          .limit(5000),
        queryExternalData<RawDeal>({
          table: 'deals',
          select: 'id, contact_id, status, pipeline_stage, valor, closed_at, updated_at, created_at',
          filters: [{ type: 'eq', column: 'user_id', value: user.id }],
          order: { column: 'updated_at', ascending: false },
          range: { from: 0, to: 1999 },
        }),
      ]);

      const ints = (interactions ?? []) as RawInteraction[];
      const deals = (dealsRes.data ?? []) as RawDeal[];

      // Agrupa interações por contato (já vem ordenado asc)
      const intsByContact = new Map<string, RawInteraction[]>();
      for (const it of ints) {
        if (!it.contact_id) continue;
        const arr = intsByContact.get(it.contact_id) ?? [];
        arr.push(it);
        intsByContact.set(it.contact_id, arr);
      }

      // Agregador por sequência
      const aggMap = new Map<string, SequenceStat & { ticketSum: number; ticketCount: number }>();
      let totalClosedDeals = 0;

      for (const deal of deals) {
        if (!deal.contact_id) continue;
        const outcome = dealOutcome(deal);
        if (!outcome) continue;
        const closedAt = deal.closed_at ?? deal.updated_at;
        if (!closedAt) continue;
        const closedTs = new Date(closedAt).getTime();
        const startTs = new Date(deal.created_at).getTime();

        const contactInts = intsByContact.get(deal.contact_id);
        if (!contactInts?.length) continue;

        // Toques entre criação e fechamento
        const channelsInOrder: SeqChannel[] = [];
        const seen = new Set<SeqChannel>();
        for (const it of contactInts) {
          const ts = new Date(it.created_at).getTime();
          if (ts < startTs - 7 * 86400_000) continue; // tolera 7d antes
          if (ts > closedTs + 86400_000) break;
          const ch = normalizeChannel(it.type);
          if (!ch || seen.has(ch)) continue;
          seen.add(ch);
          channelsInOrder.push(ch);
          if (channelsInOrder.length >= 5) break;
        }

        if (channelsInOrder.length < 2) continue;
        totalClosedDeals += 1;

        // Gera todas as sub-sequências de tamanho 2..N (prefixo)
        for (let n = 2; n <= channelsInOrder.length; n++) {
          const sub = channelsInOrder.slice(0, n);
          const key = sub.join('>');
          const existing = aggMap.get(key);
          const ticket = typeof deal.valor === 'number' ? deal.valor : 0;
          if (existing) {
            existing.totalDeals += 1;
            if (outcome === 'won') existing.won += 1;
            else existing.lost += 1;
            if (ticket > 0) {
              existing.ticketSum += ticket;
              existing.ticketCount += 1;
            }
          } else {
            aggMap.set(key, {
              sequence: sub,
              key,
              totalDeals: 1,
              won: outcome === 'won' ? 1 : 0,
              lost: outcome === 'lost' ? 1 : 0,
              winRate: 0,
              avgTicket: null,
              ticketSum: ticket > 0 ? ticket : 0,
              ticketCount: ticket > 0 ? 1 : 0,
            });
          }
        }
      }

      // Finaliza taxas + agrupa por tamanho
      const byLength: Record<number, SequenceStat[]> = { 2: [], 3: [], 4: [], 5: [] };
      let topInsight: SequenceStat | null = null;
      let topRate = 0;

      for (const stat of aggMap.values()) {
        stat.winRate = stat.totalDeals > 0 ? Math.round((stat.won / stat.totalDeals) * 100) : 0;
        stat.avgTicket = stat.ticketCount > 0 ? Math.round(stat.ticketSum / stat.ticketCount) : null;
        const len = stat.sequence.length;
        if (byLength[len]) byLength[len].push(stat);
        if (stat.totalDeals >= 3 && stat.winRate > topRate) {
          topRate = stat.winRate;
          topInsight = stat;
        }
      }

      // Ordena cada bucket por winRate desc, depois totalDeals desc; min 3 deals
      for (const len of Object.keys(byLength)) {
        const n = Number(len);
        byLength[n] = byLength[n]
          .filter(s => s.totalDeals >= 3)
          .sort((a, b) => (b.winRate - a.winRate) || (b.totalDeals - a.totalDeals))
          .slice(0, 5);
      }

      return { byLength, totalClosedDeals, topInsight };
    },
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 30 * 60 * 1000,
  });
}

export const SEQ_CHANNEL_LABELS: Record<SeqChannel, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  call: 'Ligação',
  meeting: 'Reunião',
};
