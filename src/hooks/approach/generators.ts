import { DISC_LABELS } from '@/types';
import { VAK_LABELS } from '@/types/vak';
import type {
  ApproachPhase, CommunicationChannel, PersonalizedMessage, ApproachContext,
} from './approachTypes';

// ── Strategy ──
export function getStrategyName(ctx: ApproachContext): string {
  const { discProfile, metaprogramProfile: mp } = ctx;
  if (!discProfile) return 'Abordagem Adaptativa';
  if (discProfile === 'D') return mp?.motivationDirection === 'toward' ? 'Conquista Direta' : 'Proteção de Resultados';
  if (discProfile === 'I') return mp?.referenceFrame === 'external' ? 'Conexão Social' : 'Visão Inspiradora';
  if (discProfile === 'S') return mp?.motivationDirection === 'away_from' ? 'Segurança Garantida' : 'Parceria Estável';
  if (discProfile === 'C') return mp?.workingStyle === 'procedures' ? 'Processo Estruturado' : 'Análise Profunda';
  return 'Abordagem Equilibrada';
}

export function getStrategyDescription(ctx: ApproachContext): string {
  const { discProfile, vakType, metaprogramProfile } = ctx;
  const base = DISC_LABELS[discProfile || 'D']?.description || '';
  const vak = vakType ? VAK_LABELS[vakType as keyof typeof VAK_LABELS]?.description : '';
  const meta = metaprogramProfile?.motivationDirection === 'toward'
    ? 'Foque nos benefícios e ganhos.'
    : 'Destaque os riscos que serão evitados.';
  return `${base} ${vak} ${meta}`.trim();
}

// ── Risk & Success ──
export function calculateRiskLevel(ctx: ApproachContext): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  if (ctx.hiddenObjections.length > 2) riskScore += 30;
  else if (ctx.hiddenObjections.length > 0) riskScore += 15;
  if (ctx.biasResult && ctx.biasResult.resistances.length > 2) riskScore += 25;
  if (ctx.contact.sentiment === 'negative') riskScore += 25;
  else if (ctx.contact.sentiment === 'neutral') riskScore += 10;
  if (ctx.rapportScore < 30) riskScore += 20;
  else if (ctx.rapportScore < 50) riskScore += 10;
  if (ctx.overallConfidence < 40) riskScore += 15;
  if (riskScore >= 50) return 'high';
  if (riskScore >= 25) return 'medium';
  return 'low';
}

export function calculateSuccessRate(ctx: ApproachContext): number {
  let rate = 50;
  if (ctx.overallConfidence > 70) rate += 15;
  else if (ctx.overallConfidence > 50) rate += 8;
  if (ctx.rapportScore > 70) rate += 12;
  else if (ctx.rapportScore > 50) rate += 6;
  if (ctx.contact.sentiment === 'positive') rate += 10;
  if (ctx.contact.relationshipScore && ctx.contact.relationshipScore > 70) rate += 8;
  if (ctx.activeTriggers.length > 2) rate += 8;
  if (ctx.topValues.length > 2) rate += 5;
  if (ctx.hiddenObjections.length > 2) rate -= 15;
  else if (ctx.hiddenObjections.length > 0) rate -= 8;
  if (ctx.contact.sentiment === 'negative') rate -= 15;
  if (ctx.biasResult && ctx.biasResult.resistances.length > 2) rate -= 10;
  return Math.max(15, Math.min(95, rate));
}

// ── Phases ──
export function generatePhases(ctx: ApproachContext): ApproachPhase[] {
  const { vakType, discProfile, topValues, metaprogramProfile, hiddenObjections, biasResult, rapportScore } = ctx;
  const phases: ApproachPhase[] = [];

  // Phase 1: Rapport
  const rapportActions: string[] = [];
  const rapportTechniques: string[] = [];
  const rapportScripts: string[] = [];
  if (vakType === 'V') { rapportActions.push('Compartilhe conteúdo visual relevante'); rapportTechniques.push('Espelhamento visual'); rapportScripts.push('Quero mostrar algo que vai te interessar...'); }
  else if (vakType === 'A') { rapportActions.push('Agende uma ligação de alinhamento'); rapportTechniques.push('Tom de voz harmonioso'); rapportScripts.push('Gostaria de ouvir sua opinião sobre...'); }
  else if (vakType === 'K') { rapportActions.push('Demonstre empatia genuína'); rapportTechniques.push('Conexão emocional'); rapportScripts.push('Entendo como você se sente em relação a...'); }
  else { rapportActions.push('Apresente dados e análises'); rapportTechniques.push('Credibilidade lógica'); rapportScripts.push('Analisando os dados, percebi que...'); }
  if (topValues.length > 0) rapportActions.push(`Mencione ${topValues[0]?.name || 'valores identificados'}`);
  phases.push({ id: 'rapport', name: 'Construção de Rapport', priority: 1, actions: rapportActions, techniques: rapportTechniques, scripts: rapportScripts, warnings: rapportScore < 40 ? ['Relacionamento ainda em desenvolvimento'] : [], timing: 'Início da conversa', duration: '3-5 minutos', successIndicators: ['Resposta positiva', 'Engajamento verbal', 'Perguntas do cliente'] });

  // Phase 2: Discovery
  const discoveryActions: string[] = [];
  const discoveryScripts: string[] = [];
  if (metaprogramProfile?.motivationDirection === 'toward') { discoveryActions.push('Explore metas e objetivos'); discoveryScripts.push('O que você espera alcançar com isso?'); }
  else { discoveryActions.push('Identifique dores e problemas'); discoveryScripts.push('O que mais te preocupa nessa situação?'); }
  if (metaprogramProfile?.referenceFrame === 'internal') { discoveryActions.push('Pergunte sobre sua experiência pessoal'); discoveryScripts.push('Como você avalia isso baseado na sua experiência?'); }
  else { discoveryActions.push('Mencione referências e cases'); discoveryScripts.push('Empresas similares têm obtido resultados como...'); }
  phases.push({ id: 'discovery', name: 'Descoberta de Necessidades', priority: 2, actions: discoveryActions, techniques: ['Perguntas abertas', 'Escuta ativa', 'Parafrasear'], scripts: discoveryScripts, warnings: hiddenObjections.length > 0 ? ['Existem objeções ocultas - sonde delicadamente'] : [], timing: 'Após rapport estabelecido', duration: '5-10 minutos', successIndicators: ['Cliente compartilha desafios', 'Revela prioridades', 'Demonstra vulnerabilidade'] });

  // Phase 3: Presentation
  const presentationActions: string[] = [];
  const presentationScripts: string[] = [];
  if (discProfile === 'D') { presentationActions.push('Vá direto ao resultado'); presentationScripts.push('O resultado que você terá é...'); }
  else if (discProfile === 'I') { presentationActions.push('Conte histórias de sucesso'); presentationScripts.push('Imagina o impacto quando você...'); }
  else if (discProfile === 'S') { presentationActions.push('Mostre o passo a passo'); presentationScripts.push('Vamos construir isso juntos, começando por...'); }
  else if (discProfile === 'C') { presentationActions.push('Detalhe especificações técnicas'); presentationScripts.push('Os dados mostram que...'); }
  if (ctx.activeTriggers.length > 0) presentationActions.push(`Use gatilho: ${ctx.activeTriggers[0]?.trigger.name}`);
  phases.push({ id: 'presentation', name: 'Apresentação de Valor', priority: 3, actions: presentationActions, techniques: ['Storytelling', 'Demonstração', 'Proof of concept'], scripts: presentationScripts, warnings: biasResult?.resistances.map(r => `Atenção ao viés: ${r.bias}`) || [], timing: 'Após descoberta completa', duration: '10-15 minutos', successIndicators: ['Interesse visível', 'Perguntas específicas', 'Concordância com benefícios'] });

  // Phase 4: Objections
  const objectionActions: string[] = [];
  hiddenObjections.forEach(obj => { objectionActions.push(`Sondar: ${obj.indicator}`); if (obj.suggested_probe) objectionActions.push(obj.suggested_probe); });
  if (objectionActions.length === 0) { objectionActions.push('Antecipe objeções comuns'); objectionActions.push('Valide preocupações'); }
  phases.push({ id: 'objections', name: 'Tratamento de Objeções', priority: 4, actions: objectionActions, techniques: ['Sleight of Mouth', 'Reenquadramento', 'Prova social'], scripts: ['Entendo sua preocupação, e é exatamente por isso que...', 'Muitos clientes tinham a mesma dúvida antes de...'], warnings: hiddenObjections.length > 2 ? ['Múltiplas objeções ocultas detectadas'] : [], timing: 'Durante apresentação', duration: '5-10 minutos', successIndicators: ['Objeções verbalizadas', 'Cliente considera alternativas', 'Resistência diminui'] });

  // Phase 5: Closing
  const closingActions: string[] = [];
  const closingScripts: string[] = [];
  if (discProfile === 'D') { closingActions.push('Feche com decisão rápida'); closingScripts.push('Podemos começar agora?'); }
  else if (discProfile === 'I') { closingActions.push('Feche com entusiasmo compartilhado'); closingScripts.push('Vai ser incrível! Quando começamos?'); }
  else if (discProfile === 'S') { closingActions.push('Feche com garantias'); closingScripts.push('Estou aqui para te apoiar em cada etapa.'); }
  else if (discProfile === 'C') { closingActions.push('Feche com resumo lógico'); closingScripts.push('Analisando tudo, faz sentido prosseguirmos.'); }
  phases.push({ id: 'closing', name: 'Fechamento', priority: 5, actions: closingActions, techniques: ['Fechamento alternativo', 'Fechamento assumido', 'Urgência legítima'], scripts: closingScripts, warnings: ctx.calculateRiskLevel() === 'high' ? ['Alto risco - considere múltiplos fechamentos'] : [], timing: 'Final da conversa', duration: '3-5 minutos', successIndicators: ['Acordo verbal', 'Próximos passos definidos', 'Compromisso assumido'] });

  return phases;
}

// ── Channels ──
export function generateChannels(ctx: ApproachContext): CommunicationChannel[] {
  const { vakType, discProfile, contact } = ctx;
  const channels: CommunicationChannel[] = [];
  const bestWindow = (contact.behavior as unknown as Record<string, unknown> | null)?.bestContactWindow as string || 'Manhã';

  if (vakType === 'A' || discProfile === 'I') channels.push({ channel: 'Ligação telefônica', effectiveness: 90, reason: 'Perfil auditivo/influente valoriza comunicação verbal', bestTimeSlot: bestWindow, tips: ['Varie o tom de voz', 'Use pausas estratégicas', 'Demonstre entusiasmo'] });
  if (vakType === 'V' || discProfile === 'C') channels.push({ channel: 'E-mail detalhado', effectiveness: 85, reason: 'Perfil visual/analítico prefere conteúdo estruturado', bestTimeSlot: 'Início da manhã', tips: ['Use bullet points', 'Inclua gráficos', 'Forneça anexos detalhados'] });
  if (discProfile === 'D') channels.push({ channel: 'Mensagem direta (WhatsApp)', effectiveness: 88, reason: 'Perfil dominante prefere comunicação rápida e direta', bestTimeSlot: bestWindow, tips: ['Seja conciso', 'Vá direto ao ponto', 'Evite rodeios'] });
  if (vakType === 'K' || discProfile === 'S') channels.push({ channel: 'Reunião presencial', effectiveness: 92, reason: 'Perfil cinestésico/estável valoriza conexão pessoal', bestTimeSlot: 'Meio da manhã ou tarde', tips: ['Crie ambiente acolhedor', 'Demonstre calma', 'Permita tempo para processar'] });
  channels.push({ channel: 'Videochamada', effectiveness: 75, reason: 'Combina elementos visuais e verbais', bestTimeSlot: bestWindow, tips: ['Cuide do ambiente', 'Mantenha contato visual', 'Use recursos de tela compartilhada'] });

  return channels.sort((a, b) => b.effectiveness - a.effectiveness);
}

// ── Messages ──
export function generateMessages(ctx: ApproachContext): PersonalizedMessage[] {
  const { discProfile, firstName, metaprogramProfile } = ctx;
  const messages: PersonalizedMessage[] = [];

  if (discProfile === 'D') messages.push({ context: 'Abertura', message: `${firstName}, tenho algo que pode acelerar seus resultados. Posso te mostrar em 5 minutos?`, tone: 'Direto e objetivo', keyPhrases: ['resultados', 'acelerar', 'rápido'] });
  else if (discProfile === 'I') messages.push({ context: 'Abertura', message: `${firstName}! Lembrei de você quando vi isso - acho que vai adorar!`, tone: 'Entusiasta e pessoal', keyPhrases: ['adorar', 'incrível', 'você'] });
  else if (discProfile === 'S') messages.push({ context: 'Abertura', message: `Olá ${firstName}, espero que esteja tudo bem. Gostaria de compartilhar algo que pode te ajudar.`, tone: 'Caloroso e tranquilizador', keyPhrases: ['ajudar', 'tranquilo', 'juntos'] });
  else if (discProfile === 'C') messages.push({ context: 'Abertura', message: `${firstName}, preparei uma análise detalhada que acredito ser relevante para sua situação.`, tone: 'Preciso e fundamentado', keyPhrases: ['análise', 'dados', 'detalhado'] });
  else messages.push({ context: 'Abertura', message: `Olá ${firstName}, gostaria de compartilhar algo interessante com você.`, tone: 'Neutro e profissional', keyPhrases: ['interessante', 'compartilhar'] });

  if (metaprogramProfile?.motivationDirection === 'toward') messages.push({ context: 'Follow-up', message: `${firstName}, pensando no que conversamos, isso pode te aproximar ainda mais do seu objetivo.`, tone: 'Motivacional', keyPhrases: ['objetivo', 'conquistar', 'alcançar'] });
  else messages.push({ context: 'Follow-up', message: `${firstName}, lembrei da nossa conversa - isso pode evitar aquele problema que você mencionou.`, tone: 'Protetor', keyPhrases: ['evitar', 'proteger', 'prevenir'] });

  messages.push({
    context: 'Fechamento',
    message: discProfile === 'D' ? `${firstName}, a oportunidade está aqui. Podemos fechar agora?`
      : discProfile === 'I' ? `${firstName}, vai ser demais! Estou animado para começarmos!`
      : discProfile === 'S' ? `${firstName}, estou aqui para qualquer dúvida. Quando pudermos seguir, me avisa.`
      : `${firstName}, os dados indicam que é o momento ideal. Faz sentido prosseguirmos?`,
    tone: discProfile ? DISC_LABELS[discProfile]?.name || 'Equilibrado' : 'Equilibrado',
    keyPhrases: discProfile === 'D' ? ['agora', 'fechar'] : discProfile === 'I' ? ['juntos', 'animado'] : discProfile === 'S' ? ['aqui', 'apoio'] : ['lógico', 'faz sentido'],
  });

  return messages;
}

// ── Do & Don't ──
export function generateDoAndDont(ctx: ApproachContext): { do: string[]; dont: string[] } {
  const { discProfile, vakType, biasResult } = ctx;
  const doList: string[] = [];
  const dontList: string[] = [];

  if (discProfile === 'D') { doList.push('Seja direto e objetivo', 'Foque em resultados e ROI', 'Respeite o tempo dele'); dontList.push('Enrole ou seja vago', 'Fale demais sobre detalhes', 'Questione a autoridade dele'); }
  else if (discProfile === 'I') { doList.push('Seja entusiasta e positivo', 'Use histórias e exemplos', 'Reconheça as ideias dele'); dontList.push('Seja frio ou distante', 'Ignore o aspecto social', 'Foque só em dados'); }
  else if (discProfile === 'S') { doList.push('Demonstre paciência', 'Forneça garantias', 'Construa confiança gradualmente'); dontList.push('Pressione por decisões rápidas', 'Mude planos repentinamente', 'Seja impaciente'); }
  else if (discProfile === 'C') { doList.push('Apresente dados e evidências', 'Seja preciso e detalhado', 'Dê tempo para análise'); dontList.push('Seja superficial', 'Pressione emocionalmente', 'Ignore perguntas técnicas'); }

  if (vakType === 'V') doList.push('Use recursos visuais');
  else if (vakType === 'A') doList.push('Comunique-se verbalmente');
  else if (vakType === 'K') doList.push('Demonstre empatia física');

  if (biasResult?.resistances) biasResult.resistances.slice(0, 2).forEach(r => dontList.push(`Evite estratégias que ativem: ${r.bias}`));

  return { do: doList, dont: dontList };
}

// ── Objection Handling ──
export function generateObjectionHandling(ctx: ApproachContext): { objection: string; response: string; technique: string }[] {
  const handling: { objection: string; response: string; technique: string }[] = [];

  ctx.hiddenObjections.slice(0, 3).forEach(obj => {
    const map: Record<string, { response: string; technique: string }> = {
      price: { response: 'Entendo a preocupação com investimento. Deixa eu te mostrar o retorno que outros clientes obtiveram...', technique: 'ROI e prova social' },
      timing: { response: 'Faz sentido. O que acontece se esperarmos mais tempo?', technique: 'Custo da inação' },
      authority: { response: 'Perfeito, quem mais precisa participar dessa decisão?', technique: 'Inclusão de stakeholders' },
      need: { response: 'Me ajuda a entender melhor sua situação atual...', technique: 'Redescoberta' },
    };
    const entry = map[obj.objection_type] || { response: 'Interessante ponto. Me conta mais sobre isso...', technique: 'Exploração aberta' };
    handling.push({ objection: obj.indicator, ...entry });
  });

  if (handling.length === 0) {
    handling.push({ objection: 'Preciso pensar', response: 'Claro! O que especificamente você gostaria de avaliar melhor?', technique: 'Especificação' });
    handling.push({ objection: 'Está caro', response: 'Entendo. Comparado com o custo de não resolver isso, faz sentido o investimento?', technique: 'Reframe de valor' });
  }

  return handling;
}

// ── Closing Techniques ──
export function generateClosingTechniques(ctx: ApproachContext): { technique: string; script: string; effectiveness: number; bestFor: string }[] {
  const { discProfile } = ctx;
  const techniques: { technique: string; script: string; effectiveness: number; bestFor: string }[] = [];

  if (discProfile === 'D') { techniques.push({ technique: 'Fechamento Direto', script: 'Podemos fechar agora e começar amanhã?', effectiveness: 90, bestFor: 'Perfil Dominante' }); techniques.push({ technique: 'Fechamento de Escassez', script: 'Tenho disponibilidade só até sexta. Fechamos?', effectiveness: 85, bestFor: 'Decisores rápidos' }); }
  else if (discProfile === 'I') { techniques.push({ technique: 'Fechamento Entusiasta', script: 'Vai ser incrível trabalhar juntos! Quando começamos?', effectiveness: 88, bestFor: 'Perfil Influente' }); techniques.push({ technique: 'Fechamento de Visão', script: 'Imagina quando você conquistar isso! Vamos lá?', effectiveness: 82, bestFor: 'Motivados por reconhecimento' }); }
  else if (discProfile === 'S') { techniques.push({ technique: 'Fechamento de Segurança', script: 'Estarei aqui em cada etapa. Podemos começar devagar?', effectiveness: 86, bestFor: 'Perfil Estável' }); techniques.push({ technique: 'Fechamento de Garantia', script: 'Se não funcionar, voltamos atrás. Quer experimentar?', effectiveness: 80, bestFor: 'Avessos a risco' }); }
  else if (discProfile === 'C') { techniques.push({ technique: 'Fechamento Lógico', script: 'Analisando os dados, faz sentido seguirmos. Concorda?', effectiveness: 88, bestFor: 'Perfil Analítico' }); techniques.push({ technique: 'Fechamento de Resumo', script: 'Resumindo: [benefícios]. Os números indicam que é o momento.', effectiveness: 85, bestFor: 'Decisores racionais' }); }

  techniques.push({ technique: 'Fechamento Alternativo', script: 'Você prefere começar segunda ou quarta?', effectiveness: 75, bestFor: 'Universal' });
  return techniques.sort((a, b) => b.effectiveness - a.effectiveness);
}

// ── Urgency, Trust, Accelerators ──
export function generateUrgencyTriggers(ctx: ApproachContext): string[] {
  const triggers: string[] = [];
  if (ctx.metaprogramProfile?.motivationDirection === 'toward') { triggers.push('Destaque oportunidade limitada', 'Mostre early adopters obtendo resultados'); }
  else { triggers.push('Destaque riscos de esperar', 'Mostre custo da inação'); }
  if (ctx.discProfile === 'D') triggers.push('Competidores já estão usando');
  else if (ctx.discProfile === 'I') triggers.push('Outros estão falando sobre isso');
  triggers.push('Preço promocional por tempo limitado', 'Disponibilidade reduzida');
  return triggers;
}

export function generateTrustBuilders(ctx: ApproachContext): string[] {
  const builders: string[] = [];
  if (ctx.metaprogramProfile?.referenceFrame === 'external') { builders.push('Apresente depoimentos de clientes', 'Mostre logos de empresas conhecidas', 'Cite estatísticas de mercado'); }
  else { builders.push('Respeite a experiência dele', 'Pergunte sua opinião antes de sugerir', 'Valide intuições dele'); }
  if (ctx.eqResult?.strengths?.includes('empathy')) builders.push('Demonstre compreensão genuína');
  builders.push('Seja transparente sobre limitações', 'Cumpra promessas pequenas primeiro');
  return builders;
}

export function generateDecisionAccelerators(ctx: ApproachContext): string[] {
  const accelerators: string[] = [];
  if (ctx.discProfile === 'D') { accelerators.push('Elimine burocracia', 'Ofereça decisão imediata'); }
  else if (ctx.discProfile === 'I') { accelerators.push('Torne divertido e social', 'Envolva pessoas importantes'); }
  else if (ctx.discProfile === 'S') { accelerators.push('Ofereça período de teste', 'Garanta suporte contínuo'); }
  else if (ctx.discProfile === 'C') { accelerators.push('Forneça documentação completa', 'Dê tempo, mas defina deadline'); }
  if (ctx.activeTriggers.some(t => t.trigger.name.toLowerCase().includes('urgência'))) accelerators.push('Use escassez legítima');
  accelerators.push('Simplifique a primeira ação');
  return accelerators;
}
