// ==============================================
// PROACTIVE INTELLIGENCE ENGINE
// Combines DISC + VAK + Neuro + Carnegie + Interactions
// to generate Next Best Actions in real-time
// ==============================================

import { useMemo } from 'react';
import { differenceInCalendarDays, differenceInDays, parseISO, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import { getDISCProfile, getVAKPrimary } from '@/types/behavior';
import { useLocalDay } from '@/hooks/useLocalDay';
import { DISC_APPROACH_STYLE, VAK_LANGUAGE, NEURO_BRAIN_HOOKS } from '@/lib/proactiveIntelligence';
import type { ActionPriority, NextBestAction, ApproachScript, IntelligenceInsight, ProactiveIntelligenceResult } from '@/lib/proactiveIntelligence';
export type { ActionPriority, ActionCategory, NextBestAction, ApproachScript, IntelligenceInsight, ProactiveIntelligenceResult } from '@/lib/proactiveIntelligence';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;

// ============================================
// MAIN HOOK
// ============================================

export function useProactiveIntelligence(
  contact: Contact | null,
  interactions: Interaction[],
): ProactiveIntelligenceResult {
  const currentDay = useLocalDay();
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return useMemo(() => {
    if (!contact) {
      return { actions: [], scripts: [], insights: [], healthScore: 0, urgencyLevel: 'low' as ActionPriority, summary: '' };
    }

    try {
      const behavior = contact.behavior as Record<string, unknown> | null;
      const discProfile = getDISCProfile(behavior) || 'S';
      const vakPrimary = getVAKPrimary(behavior) || 'kinesthetic';
      const relationshipScore = contact.relationship_score || 0;
      const stage = contact.relationship_stage || 'unknown';

      // Analyze interaction patterns
      const sortedInteractions = [...interactions].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastInteraction = sortedInteractions[0];
      const daysSinceLastContact = lastInteraction
        ? differenceInDays(new Date(), parseISO(lastInteraction.created_at))
        : 999;
      const totalInteractions = interactions.length;
      const recentInteractions = sortedInteractions.filter(i =>
        differenceInDays(new Date(), parseISO(i.created_at)) <= 30
      );
      const monthlyFrequency = recentInteractions.length;

      // Sentiment trend from recent interactions
      const recentSentiments = recentInteractions.slice(0, 5).map(i => i.sentiment);
      const positiveSentiments = recentSentiments.filter(s => s === 'positive' || s === 'very_positive').length;
      const negativeSentiments = recentSentiments.filter(s => s === 'negative' || s === 'very_negative').length;
      const sentimentTrend = positiveSentiments > negativeSentiments ? 'improving' :
        negativeSentiments > positiveSentiments ? 'declining' : 'stable';

      // Pending follow-ups
      const overdueFollowUps = interactions.filter(i =>
        i.follow_up_date && new Date(i.follow_up_date) < new Date() && i.follow_up_required
      );

      // Detect dominant brain system from interaction content
      const allContent = interactions.map(i => i.content || '').join(' ').toLowerCase();
      const reptilianCount = ['medo', 'perder', 'urgente', 'risco', 'proteger', 'garantia'].filter(w => allContent.includes(w)).length;
      const limbicCount = ['sinto', 'confiança', 'relacionamento', 'juntos', 'valores', 'conexão'].filter(w => allContent.includes(w)).length;
      const neocortexCount = ['análise', 'dados', 'comparar', 'lógica', 'processo', 'ROI'].filter(w => allContent.includes(w)).length;
      const dominantBrain = reptilianCount >= limbicCount && reptilianCount >= neocortexCount ? 'reptilian' :
        limbicCount >= neocortexCount ? 'limbic' : 'neocortex';

      // ============================================
      // GENERATE NEXT BEST ACTIONS
      // ============================================
      const actions: NextBestAction[] = [];
      const discStyle = DISC_APPROACH_STYLE[discProfile] || DISC_APPROACH_STYLE.S;
      const vakLang = VAK_LANGUAGE[vakPrimary] || VAK_LANGUAGE.kinesthetic;
      const neuroHook = NEURO_BRAIN_HOOKS[dominantBrain];

      // 1. FOLLOW-UP URGENCY
      if (daysSinceLastContact >= 14) {
        const urgency: ActionPriority = daysSinceLastContact >= 30 ? 'critical' : daysSinceLastContact >= 21 ? 'high' : 'medium';
        actions.push({
          id: 'follow-up-gap',
          title: daysSinceLastContact >= 30 ? '🚨 Resgate urgente!' : '⏰ Follow-up necessário',
          description: `${daysSinceLastContact} dias sem contato. Perfil ${discProfile} ${daysSinceLastContact >= 30 ? 'pode estar se desengajando' : 'precisa de atenção'}.`,
          priority: urgency,
          category: daysSinceLastContact >= 30 ? 'rescue' : 'follow_up',
          icon: daysSinceLastContact >= 30 ? '🚨' : '⏰',
          script: `${vakLang.hook} como posso ${vakLang.verbs[0]} novos resultados pra você.`,
          channel: discProfile === 'D' ? 'Ligação direta' : discProfile === 'I' ? 'WhatsApp informal' : discProfile === 'C' ? 'E-mail detalhado' : 'WhatsApp acolhedor',
          timing: discProfile === 'D' ? 'Manhã cedo (8-9h)' : discProfile === 'I' ? 'Início da tarde' : 'Meio da manhã (10-11h)',
          reason: `${daysSinceLastContact} dias sem contato + Perfil DISC ${discProfile} + VAK ${vakPrimary}`,
          frameworks: ['DISC', 'VAK', 'Carnegie'],
          confidence: Math.min(95, 60 + daysSinceLastContact),
          estimatedImpact: Math.min(90, 50 + daysSinceLastContact),
        });
      }

      // 2. OVERDUE FOLLOW-UPS
      if (overdueFollowUps.length > 0) {
        actions.push({
          id: 'overdue-followups',
          title: `📋 ${overdueFollowUps.length} follow-up(s) atrasado(s)`,
          description: `Compromissos pendentes detectados. ${discStyle.tone} é o tom ideal.`,
          priority: 'high',
          category: 'follow_up',
          icon: '📋',
          script: `Olá ${contact.first_name}! ${discProfile === 'D' ? 'Estou retomando direto ao ponto:' : discProfile === 'I' ? 'Que bom falar com você de novo!' : discProfile === 'C' ? 'Conforme combinamos anteriormente,' : 'Espero que esteja tudo bem com você.'} ${vakLang.phrases[0]} temos um ponto pendente importante.`,
          channel: 'WhatsApp',
          timing: 'Hoje, o mais rápido possível',
          reason: `${overdueFollowUps.length} follow-ups pendentes identificados`,
          frameworks: ['DISC', 'Carnegie'],
          confidence: 90,
          estimatedImpact: 75,
        });
      }

      // 3. SENTIMENT DECLINING - RESCUE
      if (sentimentTrend === 'declining' && negativeSentiments >= 2) {
        actions.push({
          id: 'sentiment-rescue',
          title: '😟 Sentimento em queda - Intervenção',
          description: `Detectamos ${negativeSentiments} interações negativas recentes. ${neuroHook.approach}.`,
          priority: 'critical',
          category: 'rescue',
          icon: '😟',
          script: `${contact.first_name}, ${vakLang.hook} o quanto valorizo nosso relacionamento. ${discProfile === 'D' ? 'Quero resolver qualquer pendência diretamente.' : discProfile === 'I' ? 'Sua satisfação é o que mais importa pra mim!' : discProfile === 'C' ? 'Gostaria de entender detalhadamente sua experiência.' : 'Quero garantir que você se sinta apoiado(a) em tudo.'}`,
          channel: 'Ligação (mais pessoal)',
          timing: 'Urgente - até amanhã',
          reason: `Tendência de sentimento negativo + Cérebro ${dominantBrain} dominante`,
          frameworks: ['Neuromarketing', 'Carnegie', 'VAK'],
          confidence: 85,
          estimatedImpact: 90,
        });
      }

      // 4. HIGH SCORE + CLOSING OPPORTUNITY
      if (relationshipScore >= 70 && stage !== 'converted' && monthlyFrequency >= 2) {
        actions.push({
          id: 'closing-window',
          title: '🎯 Janela de fechamento aberta!',
          description: `Score ${relationshipScore}/100 + ${monthlyFrequency} interações/mês. Momento ideal para avançar.`,
          priority: 'high',
          category: 'closing',
          icon: '🎯',
          script: `${contact.first_name}, ${vakLang.hook} ${discProfile === 'D' ? 'os resultados que podemos alcançar juntos. Vamos fechar?' : discProfile === 'I' ? 'como seria incrível começarmos essa jornada juntos!' : discProfile === 'C' ? 'os dados comprovam que esta é a melhor decisão.' : 'como posso garantir que você tenha total segurança nessa decisão.'}`,
          channel: discProfile === 'D' ? 'Reunião presencial' : 'Videocall',
          timing: 'Esta semana',
          reason: `Score alto (${relationshipScore}) + Frequência positiva + DISC ${discProfile}`,
          frameworks: ['DISC', 'VAK', 'Neuromarketing', 'Closing Score'],
          confidence: 80,
          estimatedImpact: 95,
        });
      }

      // 5. BIRTHDAY / RELATIONSHIP NURTURE
      if (contact.birthday) {
        const today = new Date(currentDay);
        const birthday = startOfDay(parseISO(contact.birthday));
        birthday.setFullYear(today.getFullYear());
        if (birthday < today) birthday.setFullYear(today.getFullYear() + 1);
        const daysUntilBirthday = differenceInCalendarDays(birthday, today);
        if (daysUntilBirthday <= 7 && daysUntilBirthday >= 0) {
          actions.push({
            id: 'birthday-nurture',
            title: `🎂 Aniversário em ${daysUntilBirthday === 0 ? 'HOJE!' : daysUntilBirthday + ' dia(s)'}`,
            description: `Oportunidade de ouro para Carnegie: "Faça a pessoa se sentir importante". ${discStyle.tone}.`,
            priority: daysUntilBirthday === 0 ? 'critical' : 'high',
            category: 'celebrate',
            icon: '🎂',
            script: daysUntilBirthday === 0
              ? `${contact.first_name}, parabéns! 🎉 ${discProfile === 'I' ? 'Você merece toda felicidade do mundo!' : discProfile === 'D' ? 'Desejo mais conquistas nesse novo ciclo!' : discProfile === 'C' ? 'Que este novo ano traga realizações significativas.' : 'Que você continue cercado(a) de pessoas especiais.'}`
              : `Preparar mensagem personalizada para o aniversário de ${contact.first_name} (${format(birthday, "dd 'de' MMMM", { locale: ptBR })})`,
            channel: 'WhatsApp + Ligação',
            timing: daysUntilBirthday === 0 ? 'Agora!' : `Em ${daysUntilBirthday} dia(s)`,
            reason: 'Carnegie: Faça a pessoa se sentir importante + Gatilho de Reciprocidade',
            frameworks: ['Carnegie', 'Gatilhos Mentais'],
            confidence: 100,
            estimatedImpact: 80,
          });
        }
      }

      // 6. NEW CONTACT - ONBOARDING
      if (totalInteractions <= 2 && daysSinceLastContact < 7) {
        actions.push({
          id: 'new-contact-nurture',
          title: '🌱 Novo contato - Construir rapport',
          description: `Apenas ${totalInteractions} interações. Foque em ouvir e conhecer. Carnegie: "Interesse genuíno".`,
          priority: 'medium',
          category: 'nurture',
          icon: '🌱',
          script: `${contact.first_name}, ${discProfile === 'I' ? 'adorei nosso primeiro contato!' : discProfile === 'D' ? 'direto ao ponto: quero entender seus objetivos.' : discProfile === 'C' ? 'gostaria de conhecer melhor seu contexto e necessidades.' : 'quero me certificar que entendo bem o que é importante pra você.'}`,
          channel: 'WhatsApp (leve e pessoal)',
          timing: 'Amanhã, meio da manhã',
          reason: 'Contato recente com poucas interações - fase de rapport',
          frameworks: ['Carnegie', 'DISC', 'Rapport'],
          confidence: 85,
          estimatedImpact: 70,
        });
      }

      // 7. INTELLIGENCE GAP
      if (!behavior?.discProfile || !behavior?.vakPrimary) {
        actions.push({
          id: 'intelligence-gap',
          title: '🧠 Completar perfil comportamental',
          description: `Perfil ${!behavior?.discProfile ? 'DISC' : ''} ${!behavior?.vakPrimary ? 'VAK' : ''} não detectado. Registre interações detalhadas para análise automática.`,
          priority: 'medium',
          category: 'intelligence',
          icon: '🧠',
          channel: 'Qualquer (com registro detalhado)',
          timing: 'Próxima interação',
          reason: 'Perfil comportamental incompleto limita a inteligência proativa',
          frameworks: ['DISC', 'VAK', 'NLP'],
          confidence: 100,
          estimatedImpact: 60,
        });
      }

      // Sort by priority weight
      const priorityWeight: Record<ActionPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      actions.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

      // ============================================
      // GENERATE APPROACH SCRIPTS
      // ============================================
      const scripts: ApproachScript[] = [];

      // Script 1: Opening script
      const openingByDisc =
        discProfile === 'D' ? `${contact.first_name}, tenho algo importante pra compartilhar.`
        : discProfile === 'I' ? `${contact.first_name}! Que bom falar com você! ✨`
        : discProfile === 'C' ? `Olá ${contact.first_name}, preparei uma análise relevante.`
        : `Olá ${contact.first_name}, espero que esteja tudo bem com você e sua família.`;
      scripts.push({
        id: 'opening',
        title: 'Abertura Personalizada',
        scenario: 'Primeiro contato após período sem comunicação',
        opening: openingByDisc,
        body: `${vakLang.hook} ${discStyle.focus.toLowerCase()}. ${neuroHook.approach}.`,
        closing: `${discProfile === 'D' ? 'Quando podemos conversar? Posso na terça ou quinta.' : discProfile === 'I' ? 'Vai ser incrível! Me diz quando podemos conversar!' : discProfile === 'C' ? 'Posso enviar um material mais detalhado antes da conversa?' : 'Sem pressão, me avisa quando for melhor pra você.'}`,
        channel: discProfile === 'D' ? 'Ligação' : 'WhatsApp',
        tone: discStyle.tone,
        adaptedFor: `DISC ${discProfile} + VAK ${vakPrimary} + Cérebro ${dominantBrain}`,
        keyPhrases: vakLang.phrases,
        wordsToAvoid: [discStyle.avoid],
        emotionalHook: neuroHook.trigger,
        neuralTarget: dominantBrain,
      });

      // Script 2: Follow-up post-meeting
      scripts.push({
        id: 'followup',
        title: 'Follow-up Pós-Reunião',
        scenario: 'Após reunião ou conversa importante',
        opening: `${contact.first_name}, ${discProfile === 'D' ? 'conforme alinhamos,' : discProfile === 'I' ? 'adorei nossa conversa!' : discProfile === 'C' ? 'segue o resumo conforme combinado:' : 'foi muito bom conversar com você.'}`,
        body: `${vakLang.phrases[0]} os próximos passos estão ${discProfile === 'D' ? 'claros e objetivos' : discProfile === 'I' ? 'cheios de potencial' : discProfile === 'C' ? 'documentados com detalhes' : 'bem alinhados com suas necessidades'}.`,
        closing: `${discProfile === 'D' ? 'Confirma pra seguirmos?' : discProfile === 'I' ? 'Estou empolgado(a) com os próximos passos!' : discProfile === 'C' ? 'Alguma dúvida sobre os pontos abordados?' : 'Pode contar comigo no que precisar.'}`,
        channel: 'E-mail + WhatsApp',
        tone: discStyle.tone,
        adaptedFor: `DISC ${discProfile} + VAK ${vakPrimary}`,
        keyPhrases: [...vakLang.phrases, discStyle.openWith],
        wordsToAvoid: [discStyle.avoid],
        emotionalHook: 'Reciprocidade + Compromisso',
        neuralTarget: dominantBrain,
      });

      // Script 3: Objection handling
      scripts.push({
        id: 'objection',
        title: 'Tratamento de Objeções',
        scenario: 'Quando o contato apresenta resistência',
        opening: `Entendo perfeitamente, ${contact.first_name}. ${discProfile === 'D' ? 'Vamos direto ao ponto:' : discProfile === 'I' ? 'Sua preocupação faz total sentido!' : discProfile === 'C' ? 'Deixa eu trazer mais dados sobre isso:' : 'É natural ter essa preocupação.'}`,
        body: `${neuroHook.approach}. ${vakLang.hook} como ${discProfile === 'D' ? 'outros líderes superaram essa mesma barreira' : discProfile === 'I' ? 'pessoas como você transformaram essa situação' : discProfile === 'C' ? 'os dados comprovam que a decisão é segura' : 'posso garantir a segurança dessa transição'}.`,
        closing: `${discProfile === 'D' ? 'O que precisa pra decidir hoje?' : discProfile === 'I' ? 'Imagina como vai ser quando resolvermos isso!' : discProfile === 'C' ? 'Posso enviar um case study detalhado?' : 'Posso acompanhar de perto cada etapa.'}`,
        channel: 'Ligação ou presencial',
        tone: discStyle.tone,
        adaptedFor: `DISC ${discProfile} + Neuro ${dominantBrain} + VAK ${vakPrimary}`,
        keyPhrases: [...vakLang.verbs.slice(0, 3), ...vakLang.phrases],
        wordsToAvoid: [discStyle.avoid, 'problema', 'dificuldade'],
        emotionalHook: neuroHook.trigger,
        neuralTarget: dominantBrain,
      });

      // ============================================
      // GENERATE INTELLIGENCE INSIGHTS
      // ============================================
      const insights: IntelligenceInsight[] = [
        {
          id: 'disc-insight',
          label: 'Perfil DISC',
          value: discProfile,
          trend: 'stable',
          framework: 'DISC',
          detail: discStyle.tone,
        },
        {
          id: 'vak-insight',
          label: 'Canal Sensorial',
          value: vakPrimary.charAt(0).toUpperCase() + vakPrimary.slice(1),
          trend: 'stable',
          framework: 'VAK/NLP',
          detail: `Use verbos: ${vakLang.verbs.slice(0, 3).join(', ')}`,
        },
        {
          id: 'neuro-insight',
          label: 'Cérebro Dominante',
          value: dominantBrain === 'reptilian' ? 'Reptiliano' : dominantBrain === 'limbic' ? 'Límbico' : 'Neocórtex',
          trend: 'stable',
          framework: 'Neuromarketing',
          detail: neuroHook.approach,
        },
        {
          id: 'engagement-insight',
          label: 'Engajamento',
          value: monthlyFrequency >= 4 ? 'Alto' : monthlyFrequency >= 2 ? 'Médio' : monthlyFrequency >= 1 ? 'Baixo' : 'Inativo',
          trend: monthlyFrequency >= 3 ? 'up' : monthlyFrequency === 0 ? 'warning' : 'stable',
          framework: 'Cadência',
          detail: `${monthlyFrequency} interações nos últimos 30 dias`,
        },
        {
          id: 'sentiment-insight',
          label: 'Sentimento',
          value: sentimentTrend === 'improving' ? 'Melhorando ↑' : sentimentTrend === 'declining' ? 'Caindo ↓' : 'Estável →',
          trend: sentimentTrend === 'improving' ? 'up' : sentimentTrend === 'declining' ? 'warning' : 'stable',
          framework: 'Análise Emocional',
          detail: `${positiveSentiments} positivas, ${negativeSentiments} negativas nas últimas 5`,
        },
        {
          id: 'relationship-insight',
          label: 'Score Relacionamento',
          value: `${relationshipScore}/100`,
          trend: relationshipScore >= 70 ? 'up' : relationshipScore >= 40 ? 'stable' : 'warning',
          framework: 'Relationship Intelligence',
          detail: stage === 'converted' ? 'Cliente ativo' : stage === 'engaged' ? 'Engajado' : stage === 'new' ? 'Novo' : 'Em desenvolvimento',
        },
      ];

      // Health Score
      const healthFactors = [
        daysSinceLastContact <= 7 ? 25 : daysSinceLastContact <= 14 ? 18 : daysSinceLastContact <= 30 ? 10 : 0,
        Math.min(25, monthlyFrequency * 8),
        sentimentTrend === 'improving' ? 25 : sentimentTrend === 'stable' ? 15 : 5,
        Math.min(25, relationshipScore / 4),
      ];
      const healthScore = Math.round(healthFactors.reduce((a, b) => a + b, 0));

      const urgencyLevel: ActionPriority = actions[0]?.priority || 'low';

      // Summary
      const topAction = actions[0];
      const summary = topAction
        ? `${topAction.icon} ${topAction.title} — ${topAction.channel} | ${topAction.timing}`
        : `✅ ${contact.first_name} está estável. Score: ${relationshipScore}/100, ${monthlyFrequency} interações/mês.`;

      return { actions, scripts, insights, healthScore, urgencyLevel, summary };
    } catch {
      return { actions: [], scripts: [], insights: [], healthScore: 0, urgencyLevel: 'low' as ActionPriority, summary: 'Erro ao processar inteligência' };
    }
  }, [contact, interactions, currentDay]);
}
