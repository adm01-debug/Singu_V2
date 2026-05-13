/**
 * Próximos Passos — regras determinísticas que combinam sinais já carregados
 * pela Ficha 360 (perfil, intelligence, últimas interações, prontidão).
 *
 * Função pura, sem efeitos colaterais, totalmente testável.
 */

import type { ProntidaoResult } from './leadScoring';

export type ProximoPassoChannel = 'whatsapp' | 'email' | 'call' | 'meeting' | 'linkedin';
export type ProximoPassoPriority = 'alta' | 'media' | 'baixa';

export interface ProximoPasso {
  id: string;
  channel: ProximoPassoChannel;
  title: string;
  detail: string;
  reason: string;
  priority: ProximoPassoPriority;
  scriptHint?: string;
}

interface ProfileLike {
  cadence_days?: number | null;
  last_contact_at?: string | null;
  sentiment?: string | null;
  first_name?: string | null;
}

interface IntelligenceLike {
  best_channel?: string | null;
  best_time?: string | null;
}

interface InteractionLike {
  channel?: string | null;
  direction?: string | null;
  data_interacao?: string | null;
  created_at?: string;
}

export type PassoFeedbackOutcomeHint =
  | 'respondeu_positivo'
  | 'respondeu_neutro'
  | 'nao_respondeu'
  | 'nao_atendeu'
  | 'pulou';

export interface FeedbackHint {
  passoId: string;
  lastOutcome: PassoFeedbackOutcomeHint;
  daysAgo: number;
}

export interface ComputeProximosPassosInput {
  profile: ProfileLike | null | undefined;
  intelligence: IntelligenceLike | null | undefined;
  recentInteractions: InteractionLike[] | null | undefined;
  prontidao: ProntidaoResult | null | undefined;
  birthday?: string | null;
  email?: string | null;
  feedbackHints?: FeedbackHint[] | null;
}

const PRIORITY_RANK: Record<ProximoPassoPriority, number> = { alta: 0, media: 1, baixa: 2 };
const PRIORITY_DOWN: Record<ProximoPassoPriority, ProximoPassoPriority> = {
  alta: 'media',
  media: 'baixa',
  baixa: 'baixa',
};

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function normalizeChannel(ch?: string | null): ProximoPassoChannel | null {
  const v = (ch || '').toLowerCase().trim();
  if (!v) return null;
  if (v.includes('whats')) return 'whatsapp';
  if (v.includes('mail')) return 'email';
  if (v.includes('call') || v.includes('liga') || v.includes('phone')) return 'call';
  if (v.includes('meet') || v.includes('reun')) return 'meeting';
  if (v.includes('linked')) return 'linkedin';
  return null;
}

function channelLabel(c: ProximoPassoChannel): string {
  switch (c) {
    case 'whatsapp': return 'WhatsApp';
    case 'email': return 'E-mail';
    case 'call': return 'Ligação';
    case 'meeting': return 'Reunião';
    case 'linkedin': return 'LinkedIn';
  }
}

function timeDetail(time?: string | null): string {
  const t = (time || '').trim();
  if (!t) return '';
  return ` no horário recomendado (${t})`;
}

function daysToBirthday(birthday?: string | null): number | null {
  if (!birthday) return null;
  const b = new Date(birthday);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  const next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  if (next.getTime() < now.getTime() - 86400000) {
    next.setFullYear(now.getFullYear() + 1);
  }
  return Math.ceil((next.getTime() - now.getTime()) / 86400000);
}

export function computeProximosPassos(input: ComputeProximosPassosInput): ProximoPasso[] {
  const { profile, intelligence, recentInteractions, prontidao, birthday, email, feedbackHints } = input;
  const hintsById = new Map<string, FeedbackHint>();
  for (const h of feedbackHints ?? []) {
    if (!hintsById.has(h.passoId)) hintsById.set(h.passoId, h);
  }
  const interactions = Array.isArray(recentInteractions) ? recentInteractions : [];
  const passos: ProximoPasso[] = [];

  const bestChannel = normalizeChannel(intelligence?.best_channel);
  const bestTime = intelligence?.best_time?.trim() || null;
  const lastInter = interactions[0];
  const lastChannel = normalizeChannel(lastInter?.channel);
  const lastDate = lastInter?.data_interacao || lastInter?.created_at || profile?.last_contact_at;
  const daysSinceLast = daysSince(lastDate);
  const cadence = profile?.cadence_days ?? null;
  const firstName = profile?.first_name?.trim() || 'o contato';

  // 1. Reabrir conversa se atrasado vs cadência
  if (cadence && daysSinceLast != null && daysSinceLast > cadence * 1.5) {
    const ch = bestChannel ?? lastChannel ?? 'whatsapp';
    passos.push({
      id: 'reabrir-conversa',
      channel: ch,
      title: `Reabrir conversa via ${channelLabel(ch)}`,
      detail: `${daysSinceLast}d sem contato (cadência ${cadence}d)${timeDetail(bestTime)}`,
      reason: 'Cadência ultrapassada — risco de esfriar o relacionamento',
      priority: 'alta',
      scriptHint: `Olá ${firstName}, faz um tempo que não conversamos. Queria retomar nosso último ponto e entender como posso ajudar agora.`,
    });
  }

  // 2. Agendar reunião se quente/pronto e sem meeting recente
  const hasRecentMeeting = interactions.some((it) => {
    if (normalizeChannel(it.channel) !== 'meeting') return false;
    const d = daysSince(it.data_interacao || it.created_at);
    return d != null && d <= 30;
  });
  const level = prontidao?.level;
  if ((level === 'quente' || level === 'pronto') && !hasRecentMeeting) {
    passos.push({
      id: 'agendar-reuniao',
      channel: 'meeting',
      title: 'Agendar reunião',
      detail: `Contato ${level === 'pronto' ? 'pronto para avançar' : 'quente'}${timeDetail(bestTime)}`,
      reason: 'Score de prontidão elevado e sem reunião nos últimos 30 dias',
      priority: 'alta',
      scriptHint: `${firstName}, consegue uma reunião de 30 min essa semana para avançarmos? Tenho horários ${bestTime || 'na sua preferência'}.`,
    });
  }

  // 3. WhatsApp follow-up se última for WhatsApp outbound sem resposta
  if (lastChannel === 'whatsapp' && lastInter?.direction === 'outbound') {
    const d = daysSinceLast;
    if (d != null && d >= 1 && d <= 7) {
      passos.push({
        id: 'whatsapp-followup',
        channel: 'whatsapp',
        title: 'Follow-up no WhatsApp',
        detail: `Sua última mensagem foi há ${d}d sem retorno`,
        reason: 'Reforço educado aumenta a taxa de resposta',
        priority: 'media',
        scriptHint: `${firstName}, só passando para garantir que minha última mensagem chegou. Posso ajudar em algo?`,
      });
    }
  }

  // 4. Retomar por e-mail se silêncio prolongado e tem email
  if (email && daysSinceLast != null && daysSinceLast >= 14) {
    passos.push({
      id: 'retomar-email',
      channel: 'email',
      title: 'Retomar por e-mail',
      detail: `${daysSinceLast}d em silêncio — e-mail mantém registro formal`,
      reason: 'Canal apropriado para reaquecer com contexto detalhado',
      priority: 'media',
      scriptHint: `Olá ${firstName}, queria retomar nossa conversa. Anexei abaixo um resumo do que vimos por último para facilitar.`,
    });
  }

  // 5. Aniversário próximo
  const daysToBday = daysToBirthday(birthday);
  if (daysToBday != null && daysToBday <= 7) {
    const ch = bestChannel ?? 'whatsapp';
    passos.push({
      id: 'aniversario',
      channel: ch,
      title: daysToBday === 0 ? 'Parabenizar pelo aniversário hoje' : `Parabenizar (aniversário em ${daysToBday}d)`,
      detail: `Mensagem pessoal via ${channelLabel(ch)} fortalece o vínculo`,
      reason: 'Datas pessoais geram engajamento autêntico',
      priority: 'alta',
      scriptHint: `Feliz aniversário, ${firstName}! Desejo um ótimo ano pela frente. 🎉`,
    });
  }

  // 6. Pedir feedback após reunião 1–7d
  const recentMeeting = interactions.find((it) => {
    if (normalizeChannel(it.channel) !== 'meeting') return false;
    const d = daysSince(it.data_interacao || it.created_at);
    return d != null && d >= 1 && d <= 7;
  });
  const hasFollowupAfterMeeting = recentMeeting
    ? interactions.some((it) => {
        const after = new Date(it.data_interacao || it.created_at || 0).getTime();
        const m = new Date(recentMeeting.data_interacao || recentMeeting.created_at || 0).getTime();
        return after > m && it.direction === 'inbound';
      })
    : false;
  if (recentMeeting && !hasFollowupAfterMeeting) {
    passos.push({
      id: 'pedir-feedback',
      channel: bestChannel ?? 'email',
      title: 'Pedir feedback da reunião',
      detail: 'Reunião recente sem retorno do contato',
      reason: 'Confirmar próximos passos enquanto a conversa está fresca',
      priority: 'media',
      scriptHint: `${firstName}, obrigado pela conversa. Faz sentido o que combinamos? Posso seguir com o próximo passo?`,
    });
  }

  // Fallback: se nada disparou, sugerir check-in leve
  if (passos.length === 0 && (bestChannel || lastChannel)) {
    const ch = bestChannel ?? lastChannel ?? 'whatsapp';
    passos.push({
      id: 'checkin-leve',
      channel: ch,
      title: `Check-in leve via ${channelLabel(ch)}`,
      detail: bestTime ? `Horário recomendado: ${bestTime}` : 'Mantém a relação ativa sem pressão',
      reason: 'Sem gatilhos críticos — manter cadência preventiva',
      priority: 'baixa',
      scriptHint: `Oi ${firstName}, tudo bem? Passando para saber como estão as coisas por aí.`,
    });
  }

  // Aplica hints de feedback recente
  const adjusted = passos.flatMap<ProximoPasso>((p) => {
    const hint = hintsById.get(p.id);
    if (!hint) return [p];
    // Pulou nos últimos 7d → some
    if (hint.lastOutcome === 'pulou' && hint.daysAgo < 7) return [];
    // Respondeu positivo nos últimos 7d → some (já avançou)
    if (hint.lastOutcome === 'respondeu_positivo' && hint.daysAgo < 7) return [];
    // Não respondeu há <3d → rebaixa prioridade
    if (hint.lastOutcome === 'nao_respondeu' && hint.daysAgo < 3) {
      return [{ ...p, priority: PRIORITY_DOWN[p.priority] }];
    }
    return [p];
  });

  return adjusted
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 5);
}
