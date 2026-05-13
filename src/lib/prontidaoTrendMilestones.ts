/**
 * Detecta marcos relevantes (importantes) por semana a partir do histórico
 * de interações já carregado no client. Função pura, zero rede.
 *
 * Marcos detectados:
 *  - Primeira ocorrência absoluta de cada canal (whatsapp, call, email, meeting)
 *  - Semana com pico de atividade (>= PEAK_THRESHOLD interações)
 *
 * Os marcos são alinhados às semanas existentes em `points` (ProntidaoTrendPoint).
 */
import type { ExternalInteraction } from '@/hooks/useExternalInteractions';
import type { ProntidaoTrendPoint } from './churnRisk';

export type MilestoneKind = 'first-call' | 'first-whatsapp' | 'first-email' | 'first-meeting' | 'peak';

export interface TrendMilestone {
  weekStart: string; // ISO yyyy-MM-dd, alinhado a um ponto de `points`
  kind: MilestoneKind;
  label: string; // PT-BR curto para tooltip
  score: number; // score da semana (para posicionar o ReferenceDot)
}

const PEAK_THRESHOLD = 3;

const KIND_LABEL: Record<MilestoneKind, string> = {
  'first-call': 'Primeira ligação',
  'first-whatsapp': 'Primeira conversa no WhatsApp',
  'first-email': 'Primeiro e-mail',
  'first-meeting': 'Primeira reunião',
  peak: 'Pico de interações na semana',
};

const CHANNEL_TO_KIND: Record<string, MilestoneKind> = {
  call: 'first-call',
  whatsapp: 'first-whatsapp',
  email: 'first-email',
  meeting: 'first-meeting',
};

function refDate(it: ExternalInteraction): number | null {
  const ref = it.data_interacao || it.created_at;
  if (!ref) return null;
  const t = new Date(ref).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Acha o ponto da semana cujo intervalo contém o timestamp. */
function findWeekPoint(points: ProntidaoTrendPoint[], ts: number): ProntidaoTrendPoint | null {
  for (const p of points) {
    const start = new Date(p.weekStart).getTime();
    const end = new Date(p.weekEnd).getTime() + 24 * 60 * 60 * 1000 - 1;
    if (ts >= start && ts <= end) return p;
  }
  return null;
}

export function computeTrendMilestones(
  interactions: ExternalInteraction[],
  points: ProntidaoTrendPoint[],
): TrendMilestone[] {
  if (!Array.isArray(interactions) || !Array.isArray(points) || points.length === 0) return [];

  // Ordena ascendente para detectar "primeira" ocorrência
  const sorted = [...interactions]
    .map((it) => ({ it, t: refDate(it) }))
    .filter((x): x is { it: ExternalInteraction; t: number } => x.t != null)
    .sort((a, b) => a.t - b.t);

  const milestones: TrendMilestone[] = [];
  const seenChannels = new Set<string>();
  // Limites visuais: o gráfico só desenha as semanas em `points`
  const firstWeekStart = new Date(points[0].weekStart).getTime();

  for (const { it, t } of sorted) {
    const ch = (it.channel || '').toLowerCase();
    const kind = CHANNEL_TO_KIND[ch];
    if (!kind || seenChannels.has(ch)) continue;
    seenChannels.add(ch);
    if (t < firstWeekStart) continue; // primeira ocorrência fora da janela visível
    const point = findWeekPoint(points, t);
    if (!point || !point.hasData) continue;
    milestones.push({
      weekStart: point.weekStart,
      kind,
      label: KIND_LABEL[kind],
      score: point.score,
    });
  }

  // Picos: semanas com >= PEAK_THRESHOLD interações
  for (const p of points) {
    if (p.interactionCount >= PEAK_THRESHOLD && p.hasData) {
      milestones.push({
        weekStart: p.weekStart,
        kind: 'peak',
        label: `${KIND_LABEL.peak} (${p.interactionCount})`,
        score: p.score,
      });
    }
  }

  return milestones;
}

/** Agrupa marcos por weekStart para fácil consulta no tooltip. */
export function groupMilestonesByWeek(milestones: TrendMilestone[]): Map<string, TrendMilestone[]> {
  const map = new Map<string, TrendMilestone[]>();
  for (const m of milestones) {
    const arr = map.get(m.weekStart) ?? [];
    arr.push(m);
    map.set(m.weekStart, arr);
  }
  return map;
}
