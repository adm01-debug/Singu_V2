import { useMemo } from 'react';
import { RapportProfile, RapportScript } from '@/types/nlp-advanced';
import { Contact, DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';
import { RAPPORT_TEMPLATES, POWER_WORDS } from '@/data/nlpAdvancedData';
import { getDominantVAK, getDISCProfile as getBehaviorDISC, getDISCConfidence, getContactBehavior } from '@/lib/contact-utils';

export function useRapportGenerator(contact: Contact) {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const rapportProfile = useMemo((): RapportProfile => {
    const behavior = getContactBehavior(contact);
    const vakType = getDominantVAK(contact) as VAKType;
    const discProfile = (getBehaviorDISC(contact) as DISCProfile) || 'D';

    // Generate mirroring strategies based on VAK
    const mirroringStrategies: RapportScript[] = [
      {
        id: 'mirror-vak-1',
        category: 'mirroring',
        title: `Espelhamento ${vakType === 'V' ? 'Visual' : vakType === 'A' ? 'Auditivo' : vakType === 'K' ? 'Cinestésico' : 'Digital'}`,
        script: RAPPORT_TEMPLATES.mirroring[vakType.toLowerCase() as 'visual' | 'auditory' | 'kinesthetic' | 'digital']?.[0] 
          || RAPPORT_TEMPLATES.mirroring.visual[0],
        explanation: `Use predicados ${vakType === 'V' ? 'visuais' : vakType === 'A' ? 'auditivos' : vakType === 'K' ? 'cinestésicos' : 'digitais'} para criar sintonia inconsciente`,
        adaptedFor: { vak: vakType },
        keywords: POWER_WORDS.vak[vakType] || POWER_WORDS.vak.V,
        tips: [
          `Observe quais palavras ${contact.firstName} usa com frequência`,
          'Repita as mesmas palavras-chave na sua resposta',
          'Mantenha o mesmo ritmo de fala'
        ]
      },
      {
        id: 'mirror-vak-2',
        category: 'mirroring',
        title: 'Espelhamento de Ritmo',
        script: vakType === 'K' 
          ? 'Fale mais devagar, com pausas... deixe as palavras terem peso...'
          : vakType === 'V'
          ? 'Fale em ritmo rápido, direto ao ponto, com energia!'
          : 'Mantenha um ritmo equilibrado, com variações de tom...',
        explanation: 'Adapte sua velocidade de fala ao perfil do cliente',
        adaptedFor: { vak: vakType },
        keywords: [],
        tips: [
          vakType === 'K' ? 'Faça pausas para o cliente processar' : 'Mantenha energia e dinamismo',
          'Observe a velocidade de resposta do cliente',
          'Ajuste seu ritmo gradualmente'
        ]
      }
    ];

    // Generate pacing strategies based on DISC
    const pacingStrategies: RapportScript[] = [
      {
        id: 'pace-disc-1',
        category: 'pacing',
        title: `Acompanhamento Perfil ${discProfile}`,
        script: RAPPORT_TEMPLATES.pacing[discProfile]?.[0] || 'Vamos conversar sobre o que você precisa...',
        explanation: `Adapte seu estilo ao perfil ${discProfile} do cliente`,
        adaptedFor: { disc: discProfile },
        keywords: POWER_WORDS.disc[discProfile] || [],
        tips: [
          discProfile === 'D' ? 'Seja direto e focado em resultados' :
          discProfile === 'I' ? 'Seja entusiasta e sociável' :
          discProfile === 'S' ? 'Seja paciente e ofereça segurança' :
          'Seja preciso e apresente dados'
        ]
      },
      {
        id: 'pace-disc-2',
        category: 'pacing',
        title: 'Validação do Estilo',
        script: discProfile === 'D' 
          ? `${contact.firstName}, você é uma pessoa que valoriza resultados rápidos, certo? Vou ser direto com você.`
          : discProfile === 'I'
          ? `${contact.firstName}, adoro sua energia! Vamos tornar isso uma conversa animada!`
          : discProfile === 'S'
          ? `${contact.firstName}, quero que você se sinta totalmente confortável. Vamos no seu ritmo.`
          : `${contact.firstName}, trouxe todos os dados e análises que você precisa. Vamos aos detalhes.`,
        explanation: 'Valide explicitamente o estilo de comunicação preferido',
        adaptedFor: { disc: discProfile },
        keywords: [],
        tips: ['Demonstre que você entende o estilo do cliente']
      }
    ];

    // Generate connection keywords
    const connectionKeywords = [
      ...POWER_WORDS.vak[vakType] || [],
      ...POWER_WORDS.disc[discProfile] || []
    ];

    // Generate avoid keywords
    const avoidKeywords = vakType === 'V' 
      ? ['ouvir', 'sentir', 'escutar'] 
      : vakType === 'A'
      ? ['ver', 'olhar', 'sentir']
      : vakType === 'K'
      ? ['ver', 'ouvir', 'analisar']
      : ['sentir', 'imaginar', 'intuição'];

    // Body language tips based on VAK
    const bodyLanguageTips = [
      vakType === 'V' ? 'Mantenha contato visual frequente' : 'Incline-se levemente para mostrar atenção',
      vakType === 'K' ? 'Use gestos abertos e acolhedores' : 'Espelhe sutilmente a postura do cliente',
      discProfile === 'D' ? 'Postura confiante e direta' : 'Postura relaxada e receptiva',
      'Observe os gestos do cliente e espelhe sutilmente',
      'Sorria naturalmente nos momentos apropriados'
    ];

    // Voice tips based on profile
    const voiceTips = [
      vakType === 'A' ? 'Varie o tom de voz para manter interesse' : 'Mantenha tom consistente e seguro',
      vakType === 'K' ? 'Fale mais devagar com pausas' : 'Mantenha ritmo dinâmico',
      discProfile === 'D' ? 'Tom confiante e assertivo' : 'Tom caloroso e empático',
      'Espelhe o volume de voz do cliente',
      'Use ênfase nas palavras-chave de conexão'
    ];

    // Opening lines adapted to profile
    const openingLines = [
      `${contact.firstName}, que bom ${vakType === 'V' ? 'ver você' : vakType === 'A' ? 'falar com você' : 'ter esse contato'}!`,
      discProfile === 'D' 
        ? `Vou ser direto, ${contact.firstName}. Tenho algo que vai impactar seus resultados.`
        : discProfile === 'I'
        ? `${contact.firstName}! Estava ansioso para essa conversa!`
        : discProfile === 'S'
        ? `${contact.firstName}, espero que esteja tudo bem. Vamos conversar com calma.`
        : `${contact.firstName}, preparei uma análise detalhada para você.`,
      `${contact.firstName}, ${behavior?.metaprogramProfile?.motivationDirection === 'toward' 
        ? 'tenho uma oportunidade incrível para você!' 
        : 'encontrei uma forma de resolver aquela questão.'}`
    ];

    // Transition phrases
    const transitionPhrases = [
      'Falando nisso...',
      'Isso me lembra que...',
      vakType === 'V' ? 'Olha, deixa eu te mostrar...' : vakType === 'A' ? 'Escuta só...' : 'Sente essa...',
      'E sabe o que é interessante?',
      discProfile === 'D' ? 'Agora, o que realmente importa é...' : 'Deixa eu te contar mais...'
    ];

    // Calculate rapport score
    const rapportScore = Math.min(100, 
      50 * 0.4 +
      (getDISCConfidence(contact) || 50) * 0.4 +
      50 * 0.2
    );

    return {
      mirroringStrategies,
      pacingStrategies,
      connectionKeywords,
      avoidKeywords,
      bodyLanguageTips,
      voiceTips,
      openingLines,
      transitionPhrases,
      rapportScore: Math.round(rapportScore)
    };
  }, [contact]);

  return { rapportProfile };
}
