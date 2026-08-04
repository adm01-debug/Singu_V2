/**
 * Demo contact for NLP training mode
 * Used when components are rendered without a specific contact
 * Enriched with all personality frameworks data
 */

import { Contact, ContactBehavior } from '@/types';
import { TemperamentProfile } from '@/types/temperament';

// Perfil de temperamento demo
const DEMO_TEMPERAMENT: TemperamentProfile = {
  primary: 'choleric',
  secondary: 'sanguine',
  scores: {
    sanguine: 65,
    choleric: 78,
    melancholic: 35,
    phlegmatic: 42
  },
  confidence: 72,
  analyzedAt: new Date().toISOString(),
  description: 'Perfil dominante Colérico com traços Sanguíneos. Orientado a resultados com boa capacidade de influência social.',
  strengths: ['Liderança natural', 'Foco em resultados', 'Comunicação persuasiva', 'Tomada de decisão rápida'],
  weaknesses: ['Impaciente com detalhes', 'Pode parecer dominador', 'Dificuldade em delegar'],
  communicationStyle: 'Direto e objetivo, mas com toques de entusiasmo. Prefere conversas rápidas e focadas em resultados.',
  salesApproach: [
    'Apresente ROI e resultados claros logo no início',
    'Seja direto e respeite o tempo dele',
    'Use cases de sucesso e histórias inspiradoras',
    'Ofereça opções para ele escolher',
    'Destaque vantagens competitivas e exclusividade'
  ]
};

const DEMO_BEHAVIOR: ContactBehavior = {
  discProfile: 'D',
  discConfidence: 75,
  preferredChannel: 'email',
  formalityLevel: 3,
  decisionCriteria: ['quality', 'price'],
  needsApproval: false,
  decisionPower: 7,
  supportLevel: 6,
  influencedByIds: [],
  influencesIds: [],
  currentChallenges: ['Aumentar vendas Q1', 'Reduzir churn'],
  competitorsUsed: ['Competitor A', 'Competitor B'],
  vakProfile: {
    visual: 60,
    auditory: 25,
    kinesthetic: 15,
    primary: 'V'
  },
  // Perfis de personalidade enriquecidos
  temperamentProfile: DEMO_TEMPERAMENT,
  bigFiveProfile: {
    openness: 72,
    conscientiousness: 68,
    extraversion: 81,
    agreeableness: 55,
    neuroticism: 32,
    confidence: 70,
    analyzedAt: new Date().toISOString()
  },
  mbtiProfile: {
    type: 'ENTJ',
    confidence: 68,
    dimensions: {
      E_I: { E: 78, I: 22 },
      S_N: { S: 35, N: 65 },
      T_F: { T: 72, F: 28 },
      J_P: { J: 68, P: 32 }
    },
    analyzedAt: new Date().toISOString()
  },
  enneagramProfile: {
    type: 3,
    wing: 2,
    confidence: 65,
    scores: { 1: 45, 2: 58, 3: 82, 4: 35, 5: 42, 6: 38, 7: 55, 8: 72, 9: 40 },
    analyzedAt: new Date().toISOString()
  }
};

export const DEMO_CONTACT: Contact = {
  id: 'demo',
  firstName: 'Cliente',
  lastName: 'Exemplo',
  companyId: '',
  companyName: 'Demo Corp',
  role: 'decision_maker',
  roleTitle: 'Diretor Comercial',
  relationshipStage: 'prospect',
  relationshipScore: 65,
  sentiment: 'neutral',
  interactionCount: 12,
  tags: ['VIP', 'Tech', 'B2B'],
  hobbies: ['Golf', 'Vinhos', 'Tecnologia'],
  interests: ['Inovação', 'Liderança', 'Startups'],
  lifeEvents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  behavior: DEMO_BEHAVIOR
};

// Export temperament for direct access
export const DEMO_TEMPERAMENT_PROFILE = DEMO_TEMPERAMENT;
