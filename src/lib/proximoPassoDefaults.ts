/**
 * Defaults inteligentes para o formulário rápido de "Próximos Passos".
 * Combina prioridade do passo + tipo (id) + melhor horário do contato.
 *
 * Função pura, determinística, testável.
 */

import type { ProximoPasso, ProximoPassoChannel, ProximoPassoPriority } from '@/domain/nextStepLogic';

export interface BestTimeHint {
  day_of_week?: number | null;
  hour_of_day?: number | null;
}

export interface PassoDefaults {
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  channel: ProximoPassoChannel;
  priority: ProximoPassoPriority;
  dueDateIso: string; // ISO completo combinando date+time (timezone local)
  bestTimeApplied: boolean; // true se hora veio de useBestContactTime
  bestDayApplied: boolean; // true se data foi ajustada para best day
}

const FALLBACK_HOUR_BY_CHANNEL: Record<ProximoPassoChannel, number> = {
  meeting: 10,
  call: 14,
  whatsapp: 9,
  email: 9,
  linkedin: 9,
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeString(hour: number, minute: number = 0): string {
  return `${pad(hour)}:${pad(minute)}`;
}

function combineDateTimeIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map((x) => parseInt(x, 10));
  const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return dt.toISOString();
}

function nextBusinessDay(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function extractDaysFromDetail(detail: string): number | null {
  // tenta achar padrão "em {n}d" ou "(aniversário em Xd)"
  const m = detail.match(/(\d+)\s*d(?:ia)?s?/i);
  if (m) return parseInt(m[1], 10);
  if (/hoje/i.test(detail)) return 0;
  return null;
}

/**
 * Calcula data sugerida segundo prioridade + casos especiais por id do passo.
 */
function computeSuggestedDate(passo: ProximoPasso, now: Date): { date: Date; locked: boolean } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Casos especiais — data "travada" (não ajusta por bestDay)
  if (passo.id === 'aniversario') {
    const days = extractDaysFromDetail(passo.detail) ?? 0;
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return { date: d, locked: true };
  }
  if (passo.id === 'agendar-reuniao') {
    return { date: nextBusinessDay(today), locked: true };
  }
  if (passo.id === 'whatsapp-followup') {
    return { date: today, locked: false };
  }

  // Padrão por prioridade
  const d = new Date(today);
  if (passo.priority === 'alta') {
    // hoje (a menos que já passe das 18h → amanhã)
    if (now.getHours() >= 18) d.setDate(d.getDate() + 1);
  } else if (passo.priority === 'media') {
    d.setDate(d.getDate() + 1);
  } else {
    d.setDate(d.getDate() + 3);
  }
  return { date: d, locked: false };
}

/**
 * Ajusta a data para o melhor dia da semana, se cair dentro de 7 dias e não estiver travada.
 */
function adjustToBestDay(
  date: Date,
  bestDayOfWeek: number | null | undefined,
  locked: boolean,
  priority: ProximoPassoPriority,
): { date: Date; applied: boolean } {
  if (locked || priority === 'alta' || bestDayOfWeek == null) return { date, applied: false };
  if (bestDayOfWeek < 0 || bestDayOfWeek > 6) return { date, applied: false };

  const current = date.getDay();
  if (current === bestDayOfWeek) return { date, applied: false };

  const diff = (bestDayOfWeek - current + 7) % 7; // próximos N dias até o best day
  if (diff === 0 || diff > 7) return { date, applied: false };

  const adjusted = new Date(date);
  adjusted.setDate(adjusted.getDate() + diff);
  return { date: adjusted, applied: true };
}

/**
 * Calcula a hora sugerida.
 */
function computeSuggestedTime(
  passo: ProximoPasso,
  bestTime: BestTimeHint | null | undefined,
): { hour: number; minute: number; bestTimeApplied: boolean } {
  // Reunião sempre 10:00 (não usa bestTime — reuniões têm horário comercial)
  if (passo.id === 'agendar-reuniao') {
    return { hour: 10, minute: 0, bestTimeApplied: false };
  }

  const h = bestTime?.hour_of_day;
  if (typeof h === 'number' && h >= 0 && h <= 23) {
    return { hour: h, minute: 0, bestTimeApplied: true };
  }

  return {
    hour: FALLBACK_HOUR_BY_CHANNEL[passo.channel] ?? 9,
    minute: 0,
    bestTimeApplied: false,
  };
}

export function computePassoDefaults(
  passo: ProximoPasso,
  bestTime: BestTimeHint | null | undefined,
  now: Date = new Date(),
): PassoDefaults {
  const { date: baseDate, locked } = computeSuggestedDate(passo, now);
  const { date: adjustedDate, applied: bestDayApplied } = adjustToBestDay(
    baseDate,
    bestTime?.day_of_week,
    locked,
    passo.priority,
  );
  const { hour, minute, bestTimeApplied } = computeSuggestedTime(passo, bestTime);

  const dateStr = toDateString(adjustedDate);
  const timeStr = toTimeString(hour, minute);

  return {
    date: dateStr,
    time: timeStr,
    channel: passo.channel,
    priority: passo.priority,
    dueDateIso: combineDateTimeIso(dateStr, timeStr),
    bestTimeApplied,
    bestDayApplied,
  };
}

export function priorityToTaskPriority(p: ProximoPassoPriority): 'high' | 'medium' | 'low' {
  if (p === 'alta') return 'high';
  if (p === 'media') return 'medium';
  return 'low';
}
