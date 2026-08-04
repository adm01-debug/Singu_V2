import { useMemo } from 'react';
import { Contact, DISCProfile, RelationshipStage } from '@/types';
import { 
  TriggerSuggestion, 
  TriggerType, 
  MENTAL_TRIGGERS,
  ClientTriggerAnalysis,
  PersuasionTemplate 
} from '@/types/triggers';
import { DISC_TRIGGER_PRIORITY, STAGE_TRIGGER_PRIORITY, PERSUASION_TEMPLATES } from '@/data/persuasionTemplates';

export function useClientTriggers(contact: Contact | null | undefined) {
  const analysis = useMemo<ClientTriggerAnalysis | null>(() => {
    if (!contact) return null;

    const discProfile = contact.behavior?.discProfile || null;
    const stage = contact.relationshipStage || 'unknown';
    
    const discTriggers = discProfile ? DISC_TRIGGER_PRIORITY[discProfile] || [] : [];
    const stageTriggers = STAGE_TRIGGER_PRIORITY[stage] || [];
    
    const scoredTriggers = Object.values(MENTAL_TRIGGERS).map(trigger => {
      let score = 0;
      const reasons: string[] = [];
      
      const discIndex = discTriggers.indexOf(trigger.id);
      if (discIndex !== -1) {
        score += 40 - (discIndex * 5);
        reasons.push(`Efetivo para perfil ${discProfile}`);
      }
      
      const stageIndex = stageTriggers.indexOf(trigger.id);
      if (stageIndex !== -1) {
        score += 30 - (stageIndex * 4);
        reasons.push(`Ideal para estágio "${stage}"`);
      }
      
      if (discProfile && trigger.avoidFor.includes(discProfile)) {
        score -= 50;
        reasons.push(`Evitar para perfil ${discProfile}`);
      }
      
      score += trigger.effectiveness;
      
      const template = PERSUASION_TEMPLATES.find(t => 
        t.trigger === trigger.id && 
        (t.discProfile === null || t.discProfile === discProfile)
      );
      
      return {
        trigger,
        matchScore: Math.max(0, Math.min(100, score)),
        reason: reasons.join('. ') || 'Gatilho universal',
        template: template?.template || trigger.examples[0],
        timing: trigger.timing === 'early' ? 'Início da conversa' :
                trigger.timing === 'middle' ? 'Durante negociação' :
                trigger.timing === 'closing' ? 'Fechamento' : 'Qualquer momento',
      } as TriggerSuggestion;
    });
    
    scoredTriggers.sort((a, b) => b.matchScore - a.matchScore);
    
    const primaryTriggers = scoredTriggers.filter(t => t.matchScore >= 50).slice(0, 5);
    const secondaryTriggers = scoredTriggers.filter(t => t.matchScore >= 30 && t.matchScore < 50).slice(0, 5);
    
    const avoidTriggers = scoredTriggers
      .filter(t => t.matchScore < 0)
      .map(t => t.trigger.id);
    
    let currentOpportunity = null;
    
    if (stage === 'negotiation') {
      const closingTrigger = primaryTriggers.find(t => t.trigger.timing === 'closing');
      if (closingTrigger) {
        currentOpportunity = {
          trigger: closingTrigger.trigger.id,
          reason: 'Cliente em fase de negociação - momento ideal para fechamento',
          urgency: 'high' as const,
        };
      }
    } else if (stage === 'at_risk') {
      currentOpportunity = {
        trigger: 'empathy' as TriggerType,
        reason: 'Relacionamento em risco - priorize reconexão emocional',
        urgency: 'high' as const,
      };
    } else if (contact.daysSinceContact && contact.daysSinceContact > 30) {
      currentOpportunity = {
        trigger: 'gift' as TriggerType,
        reason: 'Sem contato há mais de 30 dias - reative com valor',
        urgency: 'medium' as const,
      };
    }
    
    const negotiationTips = generateNegotiationTips(discProfile, stage, contact);
    
    return {
      contactId: contact.id,
      primaryTriggers,
      secondaryTriggers,
      avoidTriggers,
      currentOpportunity,
      negotiationTips,
    };
  }, [contact]);
  
  const getTemplates = (triggerId: TriggerType): PersuasionTemplate[] => {
    if (!contact) return [];
    return PERSUASION_TEMPLATES.filter(t => 
      t.trigger === triggerId && 
      (t.discProfile === null || t.discProfile === contact.behavior?.discProfile)
    );
  };
  
  const fillTemplate = (template: string, variables: Record<string, string>): string => {
    let filled = template;
    Object.entries(variables).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return filled;
  };
  
  return {
    analysis,
    getTemplates,
    fillTemplate,
    allTriggers: MENTAL_TRIGGERS,
    allTemplates: PERSUASION_TEMPLATES,
  };
}

function generateNegotiationTips(
  discProfile: DISCProfile, 
  stage: RelationshipStage,
  contact: Contact
): string[] {
  const tips: string[] = [];
  
  switch (discProfile) {
    case 'D':
      tips.push('🎯 Seja direto e objetivo - Dominantes não gostam de enrolação');
      tips.push('📊 Foque em resultados e números concretos');
      tips.push('⚡ Ofereça opções e deixe ele escolher - gostam de controle');
      tips.push('❌ Evite detalhes excessivos ou histórias longas');
      break;
    case 'I':
      tips.push('😊 Comece com conversa leve e conexão pessoal');
      tips.push('🌟 Use entusiasmo e energia na comunicação');
      tips.push('👥 Mencione pessoas conhecidas e casos de sucesso');
      tips.push('❌ Evite ser muito formal ou técnico');
      break;
    case 'S':
      tips.push('🤝 Construa confiança antes de vender');
      tips.push('🛡️ Enfatize segurança, garantias e suporte');
      tips.push('⏰ Dê tempo para pensar - não pressione');
      tips.push('❌ Evite mudanças bruscas ou urgência artificial');
      break;
    case 'C':
      tips.push('📋 Prepare dados detalhados e documentação');
      tips.push('🔬 Use lógica e justificativas técnicas');
      tips.push('📧 Prefira comunicação escrita para referência');
      tips.push('❌ Evite generalizações ou promessas vagas');
      break;
  }
  
  switch (stage) {
    case 'negotiation':
      tips.push('💰 Momento de apresentar condições especiais');
      tips.push('⏳ Use escassez e urgência com moderação');
      break;
    case 'at_risk':
      tips.push('❤️ Priorize reconexão emocional antes de vender');
      tips.push('🎁 Ofereça algo de valor sem pedir nada em troca');
      break;
    case 'prospect':
      tips.push('👂 Foque em entender as dores antes de apresentar soluções');
      tips.push('🎓 Posicione-se como autoridade e referência');
      break;
  }
  
  if (contact.behavior?.decisionSpeed === 'slow') {
    tips.push('⏰ Cliente decide devagar - não apresse o processo');
  }
  if (contact.behavior?.needsApproval) {
    tips.push('👥 Precisa de aprovação - identifique os outros decisores');
  }
  if (contact.behavior?.decisionCriteria?.includes('price')) {
    tips.push('💵 Preço é critério importante - prepare argumentos de valor/ROI');
  }
  
  return tips.slice(0, 6);
}
