import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  call: 'Ligação',
  meeting: 'Reunião',
  linkedin: 'LinkedIn',
  sms: 'SMS',
};

const SORT_LABELS: Record<string, string> = {
  oldest: 'mais antigos',
  relevance: 'relevância',
  entity: 'por entidade',
};

const DIRECAO_LABELS: Record<string, string> = {
  inbound: 'recebidas',
  outbound: 'enviadas',
};

const MONTHS_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const MAX_NAME = 60;
const MS_DAY = 86_400_000;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatToday(now: Date = new Date()): string {
  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_DAY);
}

/**
 * Formata um intervalo de datas em rótulo curto:
 * - "últimos 7d" / "últimos 30d" / "últimos 90d" se `ate` ~hoje e `de` está N dias atrás
 * - "abr/25" se intervalo cobre o mês inteiro
 * - "DD/MM → DD/MM" para intervalo arbitrário
 * - "≥ DD/MM" ou "≤ DD/MM" se só um dos limites
 */
export function formatDateRange(
  de?: Date,
  ate?: Date,
  now: Date = new Date(),
): string | null {
  if (!de && !ate) return null;

  if (de && ate) {
    const dayDe = startOfDay(de);
    const dayAte = startOfDay(ate);
    const today = startOfDay(now);
    const ateDiffFromToday = diffDays(dayAte, today);
    const span = diffDays(dayDe, dayAte);

    // "últimos Nd" — ate é hoje (±1d) e span ∈ {7, 14, 30, 60, 90}
    if (Math.abs(ateDiffFromToday) <= 1 && [7, 14, 30, 60, 90].includes(span)) {
      return `últimos ${span}d`;
    }

    // mês inteiro: de = dia 1, ate = último dia do mesmo mês
    if (
      dayDe.getDate() === 1 &&
      dayDe.getMonth() === dayAte.getMonth() &&
      dayDe.getFullYear() === dayAte.getFullYear()
    ) {
      const lastDay = new Date(dayDe.getFullYear(), dayDe.getMonth() + 1, 0).getDate();
      if (dayAte.getDate() === lastDay) {
        const yy = dayDe.getFullYear().toString().slice(-2);
        return `${MONTHS_PT[dayDe.getMonth()]}/${yy}`;
      }
    }

    return `${pad2(dayDe.getDate())}/${pad2(dayDe.getMonth() + 1)} → ${pad2(dayAte.getDate())}/${pad2(dayAte.getMonth() + 1)}`;
  }

  if (de) {
    return `≥ ${pad2(de.getDate())}/${pad2(de.getMonth() + 1)}`;
  }
  // só ate
  return `≤ ${pad2(ate!.getDate())}/${pad2(ate!.getMonth() + 1)}`;
}

/**
 * Gera nome de preset com base nos filtros de Interações.
 * Ex.: "Acme · WhatsApp · últimos 30d"
 */
export function suggestInteracoesPresetName(
  f: AdvancedFilters,
  now: Date = new Date(),
): string {
  const parts: string[] = [];

  if (f.q?.trim()) parts.push(`"${f.q.trim().slice(0, 24)}"`);

  if (f.company?.trim()) parts.push(f.company.trim().slice(0, 24));
  else if (f.contact?.trim()) parts.push(f.contact.trim().slice(0, 24));

  if (Array.isArray(f.canais) && f.canais.length > 0) {
    if (f.canais.length === 1) {
      parts.push(CHANNEL_LABELS[f.canais[0]] ?? f.canais[0]);
    } else if (f.canais.length === 2) {
      parts.push(f.canais.map((c) => CHANNEL_LABELS[c] ?? c).join('+'));
    } else {
      parts.push(`${f.canais.length} canais`);
    }
  }

  if (f.direcao && f.direcao !== 'all' && DIRECAO_LABELS[f.direcao]) {
    parts.push(DIRECAO_LABELS[f.direcao]);
  }

  const range = formatDateRange(f.de, f.ate, now);
  if (range) parts.push(range);

  if (f.sort && f.sort !== 'recent' && SORT_LABELS[f.sort]) {
    parts.push(SORT_LABELS[f.sort]);
  }

  if (parts.length === 0) return `Busca ${formatToday(now)}`;
  return parts.join(' · ').slice(0, MAX_NAME);
}

/**
 * Versão genérica para SearchPresetsMenu (Contatos/Empresas).
 * Usa as chaves dos filtros como dicas.
 */
export function suggestGenericPresetName(
  filters: Record<string, string[]>,
  searchTerm?: string,
  now: Date = new Date(),
): string {
  const parts: string[] = [];

  if (searchTerm?.trim()) parts.push(`"${searchTerm.trim().slice(0, 24)}"`);

  for (const [key, values] of Object.entries(filters)) {
    if (!Array.isArray(values) || values.length === 0) continue;
    if (values.length === 1) {
      parts.push(String(values[0]).slice(0, 20));
    } else {
      parts.push(`${values.length} ${key}`);
    }
  }

  if (parts.length === 0) return `Busca ${formatToday(now)}`;
  return parts.join(' · ').slice(0, MAX_NAME);
}
