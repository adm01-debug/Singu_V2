/**
 * Gerador determinístico de scripts multi-canal modulado por sentimento e horário.
 * Sem chamadas de IA, sem queries de rede — 100% client-side, instantâneo.
 */

export type ScriptChannel = 'whatsapp' | 'email' | 'call';
export type SentimentTone = 'positivo' | 'neutro' | 'negativo' | 'misto' | null | undefined;

export interface ScriptContext {
  passoId: string;
  firstName: string;
  sentiment: SentimentTone;
  bestTime?: string | null;
  daysSinceLast?: number | null;
  cadenceDays?: number | null;
}

export interface GeneratedScript {
  channel: ScriptChannel;
  subject?: string;
  body: string;
  toneLabel: string;
}

type Tone = 'direto' | 'cordial' | 'empatico';

function toneFromSentiment(s: SentimentTone): Tone {
  if (s === 'positivo') return 'direto';
  if (s === 'negativo' || s === 'misto') return 'empatico';
  return 'cordial';
}

function toneLabel(t: Tone): string {
  if (t === 'direto') return 'Direto';
  if (t === 'empatico') return 'Empático';
  return 'Cordial';
}

function nameOrDefault(n: string | null | undefined): string {
  const v = (n || '').trim();
  return v || 'tudo bem';
}

function bestTimePhrase(bt?: string | null): string {
  const v = (bt || '').trim();
  if (!v) return '';
  // se parecer "14:00" usa "às {bt}", senão usa "no período da {bt}"
  if (/^\d{1,2}[:h]\d{0,2}$/.test(v)) return `às ${v.replace('h', ':').replace(/^(\d{1,2}):?$/, '$1:00')}`;
  return v.toLowerCase().includes('manh') || v.toLowerCase().includes('tarde') || v.toLowerCase().includes('noite')
    ? `no período da ${v.toLowerCase()}`
    : `por volta de ${v}`;
}

interface Templates {
  whatsapp: { direto: string; cordial: string; empatico: string };
  email: { subject: { direto: string; cordial: string; empatico: string }; body: { direto: string; cordial: string; empatico: string } };
  call: { direto: string; cordial: string; empatico: string };
}

function templatesFor(passoId: string, ctx: ScriptContext): Templates {
  const name = nameOrDefault(ctx.firstName);
  const bt = bestTimePhrase(ctx.bestTime);
  const btSuffix = bt ? ` Posso te ligar ${bt}?` : '';
  const days = ctx.daysSinceLast ?? null;
  const cadence = ctx.cadenceDays ?? null;
  const cadenceSuffix = cadence ? ` (cadência usual de ${cadence} dias)` : '';
  const dayPlural = days === 1 ? '' : 's';
  const ctxLine = days != null
    ? `Vi que faz ${days} dia${dayPlural} desde nosso último contato${cadenceSuffix}.`
    : 'Faz um tempo desde nosso último contato.';

  const bestTimeBullet = bt ? `\n• Melhor horário sugerido: ${bt}` : '';
  const callBullets = (abertura: string, pergunta: string, proximo: string) =>
    `• Abertura: ${abertura}\n• Pergunta-chave: ${pergunta}\n• Próximo passo: ${proximo}${bestTimeBullet}`;

  // Frases condicionais baseadas no melhor horário (extraídas para evitar template aninhado).
  const btDisponibilidadeFrase = bt ? `Tenho disponibilidade ${bt}.` : 'Me diga um horário que funciona para você.';
  const btSuffixEspaco = bt ? ` ${bt}` : '';
  const btDisponibilidadeOuHorarios = bt ? `Tenho disponibilidade ${bt}.` : 'Me passe 2 ou 3 horários e eu confirmo.';
  const btDisponibilidadeAgenda = bt ? `Tenho disponibilidade ${bt}` : 'Me diga 2 horários que funcionam para você';
  const btHorarioEmpatico = bt ? `Tenho um horário ${bt}` : 'Qualquer horário que funcione para você';
  const btLigarFrase = bt ? `Posso te ligar ${bt} para alinharmos.` : 'Me avise o melhor canal e horário.';
  const btCallFrase = bt ? `uma call ${bt}` : 'uma call de 20 min na próxima semana';

  switch (passoId) {
    case 'reabrir-conversa':
      return {
        whatsapp: {
          direto: `Olá, ${name}! 👋 Faz um tempo que não conversamos — quero retomar o que vimos por último e avançar.${btSuffix}`,
          cordial: `Oi, ${name}! Tudo bem por aí? Queria retomar nossa conversa e entender como posso ajudar agora.${btSuffix}`,
          empatico: `Oi, ${name}, tudo certo? Não quero atrapalhar — só queria reabrir o canal e entender se faz sentido conversarmos de novo.`,
        },
        email: {
          subject: {
            direto: `Retomando — próximos passos`,
            cordial: `Podemos retomar nossa conversa, ${name}?`,
            empatico: `${name}, tudo bem por aí?`,
          },
          body: {
            direto: `Olá ${name},\n\n${ctxLine} Queria retomar o ponto onde paramos e propor um próximo passo claro.\n\nFaz sentido marcarmos 20 minutos esta semana para alinharmos? ${btDisponibilidadeFrase}\n\nFico no aguardo.\nAbraço`,
            cordial: `Olá ${name},\n\nEspero que esteja tudo bem. ${ctxLine} Queria retomar nossa conversa e entender como você está vendo o cenário neste momento.\n\nSe fizer sentido, posso propor uma rápida conversa para alinharmos próximos passos${btSuffixEspaco}.\n\nQualquer coisa, é só me avisar.\nAbraço`,
            empatico: `Olá ${name},\n\n${ctxLine} Não quero ser inconveniente — entendo que prioridades mudam.\n\nQueria apenas reabrir o canal e saber se algo mudou no seu lado, ou se faz sentido conversarmos novamente em outro momento.\n\nFico à disposição quando for melhor para você.\nAbraço`,
          },
        },
        call: {
          direto: callBullets(
            `${name}, tudo bem? É a [seu nome]. Liguei para retomarmos nosso último ponto.`,
            `Como você está vendo o avanço da nossa conversa hoje?`,
            `Alinhar uma reunião ainda esta semana para fechar próximos passos.`,
          ),
          cordial: callBullets(
            `Olá ${name}, é a [seu nome]. Como você está?`,
            `O que mudou no seu cenário desde nossa última conversa?`,
            `Combinar um próximo contato no horário que funcionar melhor.`,
          ),
          empatico: callBullets(
            `${name}, tudo bem? É a [seu nome]. Posso falar 2 minutinhos?`,
            `Algo mudou de prioridade aí no seu lado?`,
            `Manter o canal aberto e voltar a conversar quando for melhor para você.`,
          ),
        },
      };

    case 'agendar-reuniao':
      return {
        whatsapp: {
          direto: `${name}, tenho uma janela essa semana — fechamos 30 min para avançarmos?${btSuffix}`,
          cordial: `${name}, faz sentido marcarmos 30 min essa semana para alinharmos próximos passos?${btSuffix}`,
          empatico: `${name}, se fizer sentido para você, podemos marcar uma rápida conversa de 30 min — sem compromisso, só para alinharmos.${btSuffix}`,
        },
        email: {
          subject: {
            direto: `Reunião de 30 min — esta semana`,
            cordial: `Podemos marcar 30 minutos, ${name}?`,
            empatico: `${name}, se fizer sentido — uma conversa rápida`,
          },
          body: {
            direto: `Olá ${name},\n\nNosso último contato foi positivo e quero avançar. Proponho 30 minutos esta semana para fecharmos os próximos passos.\n\n${btDisponibilidadeOuHorarios}\n\nAbraço`,
            cordial: `Olá ${name},\n\nGostaria de propor uma conversa de 30 minutos para alinharmos os próximos passos com calma.\n\n${btDisponibilidadeAgenda} e fechamos a agenda.\n\nAbraço`,
            empatico: `Olá ${name},\n\nSei que sua agenda é cheia. Se fizer sentido, podemos reservar 30 minutos para conversarmos — sem pressão, só para entendermos juntos o melhor caminho.\n\n${btHorarioEmpatico} está ótimo.\n\nAbraço`,
          },
        },
        call: {
          direto: callBullets(
            `${name}, tudo bem? Liguei para fecharmos a agenda.`,
            `Você tem 30 min livre ${bt || 'esta semana'}?`,
            `Confirmar data, hora e enviar o convite agora.`,
          ),
          cordial: callBullets(
            `Olá ${name}, é a [seu nome]. Tudo certo?`,
            `Que horário da semana funciona melhor para uma conversa de 30 min?`,
            `Combinar 2 opções e enviar o convite ainda hoje.`,
          ),
          empatico: callBullets(
            `${name}, tudo bem? Posso falar rapidinho?`,
            `Faz sentido reservarmos 30 min em algum momento que seja confortável para você?`,
            `Sugerir 2 horários flexíveis e respeitar a preferência do contato.`,
          ),
        },
      };

    case 'whatsapp-followup':
      return {
        whatsapp: {
          direto: `${name}, tudo certo com minha última mensagem? Posso seguir com o próximo passo?`,
          cordial: `Oi ${name}, só passando para garantir que minha mensagem chegou. 🙂 Posso ajudar em algo?`,
          empatico: `Oi ${name}, sem pressa — só queria confirmar se você viu minha mensagem. Se preferir conversar depois, me avisa.`,
        },
        email: {
          subject: { direto: `Retomando minha última mensagem`, cordial: `Confirmando recebimento, ${name}`, empatico: `${name}, sem pressa` },
          body: {
            direto: `Olá ${name},\n\nQueria confirmar se você viu minha última mensagem no WhatsApp e seguir com o próximo passo.\n\n${btLigarFrase}\n\nAbraço`,
            cordial: `Olá ${name},\n\nSó passando para garantir que minha mensagem chegou. Se fizer sentido, posso retomar por aqui ou onde for mais prático para você.\n\nAbraço`,
            empatico: `Olá ${name},\n\nSem pressa — só queria deixar registrado por e-mail também, caso o WhatsApp não tenha sido o melhor canal.\n\nQuando for um bom momento, retomamos.\n\nAbraço`,
          },
        },
        call: {
          direto: callBullets(`${name}, tudo bem? Mandei msg semana passada.`, `Você conseguiu olhar a proposta?`, `Decidir próximo passo na própria ligação.`),
          cordial: callBullets(`Olá ${name}, é a [seu nome].`, `Minha última mensagem chegou em boa hora?`, `Combinar continuidade pelo canal que preferir.`),
          empatico: callBullets(`${name}, tudo bem? Posso falar 1 minuto?`, `Está sendo um bom momento para conversarmos?`, `Reagendar caso não seja oportuno.`),
        },
      };

    case 'retomar-email':
      return {
        whatsapp: {
          direto: `${name}, te mandei um e-mail agora — dá uma olhada quando puder e me retorna?${btSuffix}`,
          cordial: `Oi ${name}! Acabei de enviar um e-mail com um resumo do que vimos por último. Quando puder, dá uma conferida. 🙂`,
          empatico: `Oi ${name}, te mandei um e-mail bem curtinho com o que conversamos. Sem pressa para responder.`,
        },
        email: {
          subject: { direto: `Resumo + próximos passos`, cordial: `Retomando nossa conversa, ${name}`, empatico: `${name}, sem pressa — resumo do que vimos` },
          body: {
            direto: `Olá ${name},\n\n${ctxLine} Para facilitar a retomada, segue um resumo curto do que vimos por último e o próximo passo que proponho.\n\n[resumo do contexto]\n\nProponho ${btCallFrase} para fecharmos. Topa?\n\nAbraço`,
            cordial: `Olá ${name},\n\nEspero que esteja tudo bem. ${ctxLine} Queria retomar nossa conversa de uma forma fácil para você.\n\nSegue abaixo um resumo do que vimos por último, para você relembrar sem precisar voltar no histórico.\n\n[resumo]\n\nQuando puder, me diga o que faz mais sentido como próximo passo.\nAbraço`,
            empatico: `Olá ${name},\n\n${ctxLine} Imagino que sua rotina esteja corrida — por isso preferi mandar tudo escrito, para você ler quando for melhor.\n\n[resumo do que conversamos]\n\nNão precisa responder agora. Quando fizer sentido, retomamos.\nAbraço`,
          },
        },
        call: {
          direto: callBullets(`${name}, te mandei um e-mail agora.`, `Posso te explicar em 5 min o que está lá?`, `Marcar a próxima reunião na própria ligação.`),
          cordial: callBullets(`Olá ${name}, é a [seu nome].`, `Você prefere que eu envie por e-mail ou conversamos agora?`, `Combinar canal preferido para próximos passos.`),
          empatico: callBullets(`${name}, tudo bem? Posso falar?`, `O e-mail é o melhor canal para retomarmos?`, `Respeitar canal de preferência e ajustar abordagem.`),
        },
      };

    case 'aniversario':
      return {
        whatsapp: {
          direto: `Feliz aniversário, ${name}! 🎉 Tudo de bom para o seu novo ciclo!`,
          cordial: `Feliz aniversário, ${name}! 🎂 Que seja um ano incrível, com muitas conquistas. 🙌`,
          empatico: `${name}, parabéns! 🎉 Desejo um ano leve, com saúde e tempo para o que importa.`,
        },
        email: {
          subject: { direto: `Feliz aniversário, ${name}! 🎉`, cordial: `Parabéns, ${name}! 🎂`, empatico: `${name}, um ano leve para você` },
          body: {
            direto: `Olá ${name},\n\nFeliz aniversário! Que esse novo ciclo venha cheio de boas conquistas.\n\nUm grande abraço`,
            cordial: `Olá ${name},\n\nFeliz aniversário! Desejo um ano incrível, com saúde, alegria e muitas realizações.\n\nUm abraço`,
            empatico: `Olá ${name},\n\nPassando rapidinho para desejar um feliz aniversário. Que esse ano traga leveza, saúde e momentos bons com quem você ama.\n\nUm abraço`,
          },
        },
        call: {
          direto: callBullets(`${name}, parabéns!`, `Como vai a comemoração?`, `Aproveitar para combinar um café no mês.`),
          cordial: callBullets(`Olá ${name}, parabéns!`, `Como você está comemorando?`, `Sugerir um encontro casual em breve.`),
          empatico: callBullets(`${name}, parabéns! Posso falar rapidinho?`, `Está sendo um dia tranquilo para você?`, `Apenas marcar presença, sem pauta comercial.`),
        },
      };

    case 'pedir-feedback':
      return {
        whatsapp: {
          direto: `${name}, valeu pela conversa! Faz sentido o que combinamos? Posso seguir?`,
          cordial: `Oi ${name}! Obrigado pela reunião. Como você ficou em relação ao que conversamos?`,
          empatico: `Oi ${name}, obrigada pela conversa. Sem pressão — qualquer dúvida do que falamos, me chama.`,
        },
        email: {
          subject: { direto: `Próximos passos da nossa reunião`, cordial: `Como você ficou, ${name}?`, empatico: `${name}, qualquer dúvida estou por aqui` },
          body: {
            direto: `Olá ${name},\n\nObrigado pela reunião. Para mantermos o ritmo, gostaria de confirmar se podemos avançar com o que combinamos:\n\n[próximos passos combinados]\n\nMe confirma e eu sigo.\nAbraço`,
            cordial: `Olá ${name},\n\nObrigado pela conversa de ontem. Queria entender como você ficou em relação ao que vimos e se faz sentido seguirmos como combinado.\n\nFico no aguardo do seu retorno.\nAbraço`,
            empatico: `Olá ${name},\n\nObrigado pela conversa. Sei que precisa de tempo para digerir tudo — fica à vontade.\n\nSe surgir qualquer dúvida ou se algo mudou de visão, é só me chamar.\nAbraço`,
          },
        },
        call: {
          direto: callBullets(`${name}, tudo bem? Sobre nossa reunião —`, `Posso seguir com o que combinamos?`, `Confirmar prazo e enviar próximo material.`),
          cordial: callBullets(`Olá ${name}, é a [seu nome].`, `Como você ficou com o que conversamos?`, `Ajustar plano conforme retorno e reagendar próximo touchpoint.`),
          empatico: callBullets(`${name}, tudo bem? Posso falar 2 min?`, `Surgiu alguma dúvida do que vimos?`, `Dar espaço se precisar pensar mais e marcar retorno.`),
        },
      };

    case 'checkin-leve':
    default:
      return {
        whatsapp: {
          direto: `${name}, tudo certo por aí? Passando rápido para manter contato.${btSuffix}`,
          cordial: `Oi ${name}! Tudo bem? Só um check-in rápido para saber como estão as coisas. 🙂`,
          empatico: `Oi ${name}, tudo certo? Sem pauta, só passando para deixar o canal aberto.`,
        },
        email: {
          subject: { direto: `Check-in rápido`, cordial: `Como estão as coisas, ${name}?`, empatico: `${name}, só passando para dizer oi` },
          body: {
            direto: `Olá ${name},\n\nQueria fazer um check-in rápido — como estão as coisas no seu lado?\n\nQualquer ponto que possamos avançar juntos, é só me avisar.\n\nAbraço`,
            cordial: `Olá ${name},\n\nEspero que esteja tudo bem. Passando para um check-in leve e saber como estão as coisas por aí.\n\nQualquer coisa em que eu possa ajudar, é só me chamar.\n\nAbraço`,
            empatico: `Olá ${name},\n\nSem pauta hoje — só queria deixar o canal aberto e desejar uma boa semana.\n\nQuando fizer sentido para você, conversamos.\n\nAbraço`,
          },
        },
        call: {
          direto: callBullets(`${name}, tudo bem? Check-in rápido.`, `Tem algo em que posso ajudar agora?`, `Alinhar próxima conversa na agenda.`),
          cordial: callBullets(`Olá ${name}, é a [seu nome].`, `Como estão as coisas por aí?`, `Manter relação ativa e propor encontro futuro.`),
          empatico: callBullets(`${name}, tudo bem? Liguei só para um oi.`, `Está sendo um bom momento para conversarmos?`, `Respeitar tempo e remarcar se necessário.`),
        },
      };
  }
}

// ============= Convite de reunião confirmada =============

export interface MeetingInviteContext {
  firstName: string;
  scheduledAt: Date;
  durationMinutes: number;
  modality: 'video' | 'presencial' | 'phone';
  meetingUrl?: string | null;
  sentiment?: SentimentTone;
}

const DIAS_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function formatDatePtBr(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${DIAS_PT[d.getDay()]}, ${dd}/${mm} às ${hh}:${mi}`;
}

function modalityLine(modality: 'video' | 'presencial' | 'phone', url?: string | null): string {
  if (modality === 'video') return url ? `Link: ${url}` : 'Modalidade: vídeo (link em breve)';
  if (modality === 'presencial') return 'Local: a confirmar';
  return 'Modalidade: ligação telefônica';
}

export function generateMeetingInvite(ctx: MeetingInviteContext): {
  whatsapp: string;
  email: { subject: string; body: string };
} {
  const tone = toneFromSentiment(ctx.sentiment);
  const name = nameOrDefault(ctx.firstName);
  const when = formatDatePtBr(ctx.scheduledAt);
  const duration = `${ctx.durationMinutes} min`;
  const modLine = modalityLine(ctx.modality, ctx.meetingUrl);

  const whatsapp =
    tone === 'direto'
      ? `${name}, confirmado nossa reunião ${when} (${duration}). ${modLine} 🤝 Qualquer ajuste, me avisa.`
      : tone === 'empatico'
        ? `Oi ${name}, agendei nossa conversa ${when} (${duration}). ${modLine} Se precisar reagendar, sem problema — é só me avisar. 🙏`
        : `Oi ${name}! Reunião marcada ${when} (${duration}). ${modLine} Nos vemos lá! 🙂`;

  const subject =
    tone === 'direto'
      ? `Confirmado: reunião ${when}`
      : tone === 'empatico'
        ? `${name}, reunião marcada — ${when}`
        : `Reunião agendada — ${when}`;

  const bodyOpening =
    tone === 'direto'
      ? `Olá ${name},\n\nConfirmando nossa reunião:`
      : tone === 'empatico'
        ? `Olá ${name},\n\nObrigado pela disponibilidade. Agendei nossa conversa:`
        : `Olá ${name},\n\nSegue confirmação da nossa reunião:`;

  const bodyClose =
    tone === 'direto'
      ? `Qualquer ajuste, me avise.\n\nAbraço`
      : tone === 'empatico'
        ? `Se precisar reagendar, fique à vontade — adapto à sua agenda.\n\nAbraço`
        : `Fico à disposição para qualquer dúvida.\n\nAbraço`;

  const body = `${bodyOpening}\n\n• Quando: ${when}\n• Duração: ${duration}\n• ${modLine}\n\n${bodyClose}`;

  return {
    whatsapp,
    email: { subject, body },
  };
}

/**
 * Constrói um assunto de e-mail contextual e personalizado por passo + sentimento.
 * Garante que todo script de e-mail tenha um subject preenchido, mesmo para passoIds desconhecidos.
 */
export function buildEmailSubject(passoId: string, firstName: string, sentiment: SentimentTone): string {
  const name = nameOrDefault(firstName);
  const tone = toneFromSentiment(sentiment);

  const catalog: Record<string, { direto: string; cordial: string; empatico: string }> = {
    'whatsapp-followup': {
      direto: `Retomando minha última mensagem`,
      cordial: `Retomando nossa conversa, ${name}`,
      empatico: `${name}, sem pressa — só confirmando`,
    },
    'ligacao-checkin': {
      direto: `Retomando nossa conversa, ${name}`,
      cordial: `Podemos retomar, ${name}?`,
      empatico: `${name}, tudo bem por aí?`,
    },
    'email-nutricao': {
      direto: `${name}, conteúdo que pode te interessar`,
      cordial: `${name}, separei algo que pode te ajudar`,
      empatico: `${name}, sem compromisso — uma leitura para você`,
    },
    'agendar-reuniao': {
      direto: `Proposta de horário para conversarmos`,
      cordial: `Podemos marcar 30 minutos, ${name}?`,
      empatico: `${name}, se fizer sentido — uma conversa rápida`,
    },
    'aniversario': {
      direto: `Parabéns, ${name}! 🎉`,
      cordial: `Feliz aniversário, ${name}! 🎂`,
      empatico: `${name}, um ano leve para você`,
    },
    'reativacao': {
      direto: `Faz tempo, ${name} — vamos retomar?`,
      cordial: `Faz tempo, ${name} — tudo bem?`,
      empatico: `${name}, sem pressa — só um oi`,
    },
  };

  const entry = catalog[passoId];
  if (entry) return entry[tone];
  return `Olá, ${name}`;
}

export function generateScripts(ctx: ScriptContext): GeneratedScript[] {
  const tone = toneFromSentiment(ctx.sentiment);
  const t = templatesFor(ctx.passoId, ctx);
  const label = toneLabel(tone);

  // Garante subject sempre preenchido (template > catálogo de fallback > genérico)
  const emailSubject =
    t.email.subject[tone] || buildEmailSubject(ctx.passoId, ctx.firstName, ctx.sentiment);

  return [
    { channel: 'whatsapp', body: t.whatsapp[tone], toneLabel: label },
    {
      channel: 'email',
      subject: emailSubject,
      body: t.email.body[tone],
      toneLabel: label,
    },
    { channel: 'call', body: t.call[tone], toneLabel: label },
  ];
}
