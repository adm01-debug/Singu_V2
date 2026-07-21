import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { queryExternalData } from '@/lib/externalData';

export type Channel = 'whatsapp' | 'email' | 'call' | 'meeting';
export const CHANNELS: Channel[] = ['whatsapp', 'email', 'call', 'meeting'];

export const STAGES = ['lead', 'qualificacao', 'proposta', 'negociacao', 'fechamento'] as const;
export type Stage = typeof STAGES[number];

export interface MatrixCell {
  channel: Channel;
  stage: Stage;
  total: number;
  advanced: number;
  rate: number; // 0-100
  avgDays: number | null;
}

export interface MatrixResult {
  cells: MatrixCell[];
  winnerByStage: Partial<Record<Stage, Channel>>;
  totalInteractions: number;
  bestInsight: { from: Stage; to: Stage; channel: Channel; rate: number } | null;
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
  pipeline_stage?: string | null;
  status?: string | null;
  created_at: string;
  updated_at?: string | null;
  closed_at?: string | null;
}

function normalizeChannel(t: string | null): Channel | null {
  if (!t) return null;
  const s = t.toLowerCase();
  if (s.includes('whats')) return 'whatsapp';
  if (s.includes('email') || s.includes('mail')) return 'email';
  if (s.includes('call') || s.includes('ligaca') || s.includes('telefon') || s.includes('voip')) return 'call';
  if (s.includes('meet') || s.includes('reuni') || s.includes('visit')) return 'meeting';
  return null;
}

function normalizeStage(s: string | null | undefined): Stage | null {
  if (!s) return null;
  const v = s.toLowerCase();
  if (v.includes('lead') || v.includes('novo')) return 'lead';
  if (v.includes('qualif')) return 'qualificacao';
  if (v.includes('propos')) return 'proposta';
  if (v.includes('negoc')) return 'negociacao';
  if (v.includes('fech') || v.includes('won') || v.includes('ganho')) return 'fechamento';
  return null;
}

const STAGE_ORDER: Record<Stage, number> = {
  lead: 0, qualificacao: 1, proposta: 2, negociacao: 3, fechamento: 4,
};

export function useChannelPerformanceMatrix() {
  const { user } = useAuth();
  return useQuery<MatrixResult>({
    queryKey: ['channel-performance-matrix', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      if (!user) return { cells: [], winnerByStage: {}, totalInteractions: 0, bestInsight: null };

      const [{ data: interactions }, dealsRes] = await Promise.all([
        supabase.from('interactions')
          .select('id, type, contact_id, created_at')
          .eq('user_id', user.id)
          .gte('created_at', since)
          .order('created_at', { ascending: true })
          .limit(5000),
        queryExternalData<RawDeal>({
          table: 'deals',
          select: 'id, contact_id, pipeline_stage, status, created_at, updated_at, closed_at',
          filters: [{ type: 'eq', column: 'user_id', value: user.id }],
          order: { column: 'updated_at', ascending: false },
          range: { from: 0, to: 1999 },
        }),
      ]);

      const ints = (interactions ?? []) as RawInteraction[];
      const deals = (dealsRes.data ?? []) as RawDeal[];

      // Mapa: contact_id -> deals (com stage atual)
      const dealsByContact = new Map<string, RawDeal[]>();
      for (const d of deals) {
        if (!d.contact_id) continue;
        const arr = dealsByContact.get(d.contact_id) ?? [];
        arr.push(d);
        dealsByContact.set(d.contact_id, arr);
      }

      // Inicializa células
      const map = new Map<string, MatrixCell>();
      for (const c of CHANNELS) {
        for (const s of STAGES) {
          map.set(`${c}|${s}`, { channel: c, stage: s, total: 0, advanced: 0, rate: 0, avgDays: null });
        }
      }
      const daysAccum = new Map<string, number[]>();

      // Para cada interação, vincula ao deal do contato e ao stage atual do deal
      // "Avanço" = deal tem stage > stage no momento OU foi fechado em até 14d após interação
      for (const it of ints) {
        const ch = normalizeChannel(it.type);
        if (!ch || !it.contact_id) continue;
        const contactDeals = dealsByContact.get(it.contact_id);
        if (!contactDeals?.length) continue;

        // Pega o deal mais relevante (último atualizado)
        const deal = contactDeals[0];
        const currentStage = normalizeStage(deal.pipeline_stage ?? deal.status);
        if (!currentStage) continue;

        // Stage "no momento da interação" — heurística: assumimos stage anterior se updated_at > interaction
        const intDate = new Date(it.created_at).getTime();
        const updatedAt = deal.updated_at ? new Date(deal.updated_at).getTime() : intDate;
        const stageAtInteraction: Stage = updatedAt > intDate && STAGE_ORDER[currentStage] > 0
          ? STAGES[STAGE_ORDER[currentStage] - 1]
          : currentStage;

        const key = `${ch}|${stageAtInteraction}`;
        const cell = map.get(key);
        if (!cell) continue;
        cell.total += 1;

        // Avançou se stage atual > stage no momento da interação
        if (STAGE_ORDER[currentStage] > STAGE_ORDER[stageAtInteraction]) {
          const days = Math.max(0, (updatedAt - intDate) / (1000 * 60 * 60 * 24));
          if (days <= 30) {
            cell.advanced += 1;
            const arr = daysAccum.get(key) ?? [];
            arr.push(days);
            daysAccum.set(key, arr);
          }
        }
      }

      // Calcula taxa e média
      const cells: MatrixCell[] = [];
      for (const cell of map.values()) {
        cell.rate = cell.total > 0 ? Math.round((cell.advanced / cell.total) * 100) : 0;
        const days = daysAccum.get(`${cell.channel}|${cell.stage}`);
        cell.avgDays = days?.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null;
        cells.push(cell);
      }

      // Vencedor por estágio (maior taxa, mínimo 3 interações)
      const winnerByStage: Partial<Record<Stage, Channel>> = {};
      for (const stage of STAGES) {
        const candidates = cells.filter(c => c.stage === stage && c.total >= 3);
        if (!candidates.length) continue;
        const top = candidates.reduce((a, b) => (b.rate > a.rate ? b : a));
        if (top.rate > 0) winnerByStage[stage] = top.channel;
      }

      // Melhor insight global
      let bestInsight: MatrixResult['bestInsight'] = null;
      let bestRate = 0;
      for (const cell of cells) {
        if (cell.total >= 5 && cell.rate > bestRate && STAGE_ORDER[cell.stage] < 4) {
          bestRate = cell.rate;
          bestInsight = {
            from: cell.stage,
            to: STAGES[STAGE_ORDER[cell.stage] + 1],
            channel: cell.channel,
            rate: cell.rate,
          };
        }
      }

      return {
        cells,
        winnerByStage,
        totalInteractions: ints.length,
        bestInsight,
      };
    },
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 30 * 60 * 1000,
  });
}

export const STAGE_LABELS: Record<Stage, string> = {
  lead: 'Lead',
  qualificacao: 'Qualificação',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechamento: 'Fechamento',
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  call: 'Ligação',
  meeting: 'Reunião',
};
