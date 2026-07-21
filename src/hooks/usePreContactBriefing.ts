import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { addMinutes, isWithinInterval, parseISO, format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { getContactBehavior } from '@/lib/contact-utils';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;
type Company = Tables<'companies'>;

interface VAKProfile {
  visual: number;
  auditory: number;
  kinesthetic: number;
  digital: number;
  dominant: string;
}

interface EmotionalProfile {
  currentState: string;
  trend: 'improving' | 'stable' | 'declining';
  resistanceLevel: number;
}

interface NLPBriefing {
  contact: Contact;
  company: Company | null;
  interaction: Interaction;
  vakProfile: VAKProfile;
  discProfile: DISCProfileData;
  emotionalProfile: EmotionalProfile;
  topValues: string[];
  wordsToUse: string[];
  wordsToAvoid: string[];
  openingTips: string[];
  closingMoment: string;
  recentObjections: string[];
  rapportScore: number;
  lastInteractionSummary: string | null;
  minutesUntilMeeting: number;
}

export interface PreContactBriefingData {
  upcomingBriefings: NLPBriefing[];
  activeBriefing: NLPBriefing | null;
  loading: boolean;
  dismissBriefing: (interactionId: string) => void;
  showBriefingFor: (interactionId: string) => void;
}

// Helper to detect VAK from text
function analyzeVAK(texts: string[]): VAKProfile {
  const content = texts.join(' ').toLowerCase();
  const vakPatterns = {
    visual: ['ver', 'visualizar', 'claro', 'brilhante', 'imagem', 'perspectiva', 'olhar', 'mostrar', 'aparência', 'foco', 'ilustrar', 'cores'],
    auditory: ['ouvir', 'som', 'escutar', 'ritmo', 'tom', 'harmonia', 'conversar', 'dizer', 'discutir', 'volume', 'silêncio', 'ressoar'],
    kinesthetic: ['sentir', 'toque', 'concreto', 'sólido', 'peso', 'pressão', 'mover', 'ação', 'prático', 'experiência', 'impacto', 'conexão'],
    digital: ['pensar', 'lógico', 'analisar', 'processo', 'sistema', 'compreender', 'sentido', 'dados', 'fatos', 'considerar', 'raciocínio']
  };
  const scores = { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 };
  Object.entries(vakPatterns).forEach(([type, words]) => {
    words.forEach(word => { const matches = content.match(new RegExp(word, 'gi')); if (matches) scores[type as keyof typeof scores] += matches.length; });
  });
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const normalized = { visual: Math.round((scores.visual / total) * 100), auditory: Math.round((scores.auditory / total) * 100), kinesthetic: Math.round((scores.kinesthetic / total) * 100), digital: Math.round((scores.digital / total) * 100), dominant: '' };
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  normalized.dominant = (sorted[0]?.[0] || 'visual').charAt(0).toUpperCase() + (sorted[0]?.[0] || 'visual').slice(1);
  return normalized;
}

function analyzeEmotionalState(texts: string[]): EmotionalProfile {
  const content = texts.join(' ').toLowerCase();
  const emotionPatterns = {
    positive: ['satisfeito', 'feliz', 'animado', 'otimista', 'confiante', 'empolgado', 'interessado', 'entusiasmado'],
    neutral: ['ok', 'bem', 'normal', 'considerando', 'pensando', 'avaliando'],
    negative: ['preocupado', 'hesitante', 'inseguro', 'frustrado', 'irritado', 'desconfiado', 'cético']
  };
  const scores = { positive: 0, neutral: 0, negative: 0 };
  Object.entries(emotionPatterns).forEach(([type, words]) => { words.forEach(word => { if (content.includes(word)) scores[type as keyof typeof scores]++; }); });
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  return {
    currentState: dominant === 'positive' ? 'Positivo' : dominant === 'negative' ? 'Cauteloso' : 'Neutro',
    trend: scores.positive > scores.negative ? 'improving' : scores.negative > scores.positive ? 'declining' : 'stable',
    resistanceLevel: Math.min(100, scores.negative * 20)
  };
}

interface DISCProfileData {
  type: string;
  description: string;
  salesStrategies: { opening: string[]; presentation: string[]; objectionHandling: string[]; closing: string[] };
  avoidBehaviors: string[];
}

function getDISCProfileFromContact(contact: Contact): DISCProfileData {
  const behavior = getContactBehavior(contact);
  const disc = behavior?.disc || behavior?.discProfile;
  if (!disc) return { type: 'N/A', description: 'Perfil não identificado ainda', salesStrategies: { opening: ['Observe padrões de comunicação para identificar perfil'], presentation: ['Seja adaptável às reações do cliente'], objectionHandling: ['Escute atentamente antes de responder'], closing: ['Pergunte diretamente sobre próximos passos'] }, avoidBehaviors: ['Assumir preferências sem dados'] };
  const discDescriptions: Record<string, string> = { D: 'Dominante - Direto, orientado a resultados, decisivo', I: 'Influente - Entusiasta, otimista, colaborativo', S: 'Estável - Paciente, confiável, bom ouvinte', C: 'Consciente - Analítico, preciso, orientado a qualidade' };
  const discSalesStrategies: Record<string, DISCProfileData['salesStrategies']> = {
    D: { opening: ['Vá direto ao ponto - evite conversa fiada', 'Apresente resultados logo no início'], presentation: ['Foque em ROI e resultados', 'Seja conciso - máximo 3 pontos principais'], objectionHandling: ['Não discuta - apresente alternativas', 'Mostre dados de performance'], closing: ['Dê opções: "A ou B?"', 'Destaque vantagem competitiva imediata'] },
    I: { opening: ['Comece com entusiasmo genuíno', 'Pergunte sobre projetos recentes'], presentation: ['Conte histórias de sucesso', 'Envolva-o na visão do projeto'], objectionHandling: ['Reconheça sentimentos', 'Transforme em oportunidade criativa'], closing: ['Celebre a parceria', 'Mencione impacto social/visibilidade'] },
    S: { opening: ['Seja caloroso mas não apressado', 'Pergunte sobre a equipe/família'], presentation: ['Mostre estabilidade e suporte', 'Dê tempo para processar'], objectionHandling: ['Valide preocupações sinceramente', 'Ofereça garantias e suporte'], closing: ['Não pressione - ofereça mais tempo', 'Destaque relacionamento de longo prazo'] },
    C: { opening: ['Seja pontual e prepare dados', 'Pergunte sobre análises anteriores'], presentation: ['Apresente detalhes e documentação', 'Antecipe perguntas técnicas'], objectionHandling: ['Forneça evidências escritas', 'Aceite revisar depois se precisar'], closing: ['Dê tempo para análise', 'Ofereça comparativo técnico detalhado'] }
  };
  const discAvoidBehaviors: Record<string, string[]> = {
    D: ['Ser vago ou indeciso', 'Perder tempo com detalhes irrelevantes', 'Mostrar insegurança'],
    I: ['Ser muito técnico ou frio', 'Ignorar aspecto emocional', 'Interromper suas histórias'],
    S: ['Pressionar por decisão rápida', 'Mudanças bruscas de assunto', 'Ignorar preocupações'],
    C: ['Afirmações sem dados', 'Pressa nas explicações', 'Falta de precisão nos números']
  };
  return { type: disc, description: discDescriptions[disc] || 'Perfil misto', salesStrategies: discSalesStrategies[disc] || discSalesStrategies['I'], avoidBehaviors: discAvoidBehaviors[disc] || [] };
}

function generateOpeningTips(vakProfile: VAKProfile, discProfile: { type: string }): string[] {
  const tips: string[] = [];
  if (vakProfile.dominant === 'Visual') { tips.push('📊 Use gráficos ou apresentações visuais'); tips.push('🎨 Descreva cenários e "pinte o quadro"'); }
  else if (vakProfile.dominant === 'Auditory') { tips.push('🎵 Mantenha tom de voz agradável e ritmado'); tips.push('💬 Use histórias e exemplos verbais'); }
  else if (vakProfile.dominant === 'Kinesthetic') { tips.push('🤝 Crie conexão pessoal primeiro'); tips.push('💪 Fale de resultados práticos e tangíveis'); }
  else { tips.push('📋 Apresente dados e fatos concretos'); tips.push('🔍 Seja lógico e estruturado'); }
  if (discProfile.type === 'D') tips.push('⚡ Seja direto e objetivo');
  else if (discProfile.type === 'I') tips.push('😊 Comece com conversa leve e entusiasmo');
  else if (discProfile.type === 'S') tips.push('🕐 Dê tempo para ele processar');
  else if (discProfile.type === 'C') tips.push('📝 Tenha detalhes e documentação prontos');
  return tips.slice(0, 4);
}

function getRecommendedWords(vakProfile: VAKProfile): { use: string[]; avoid: string[] } {
  const wordSets: Record<string, { use: string[]; avoid: string[] }> = {
    Visual: { use: ['veja', 'imagine', 'claro', 'perspectiva', 'visualize', 'demonstro'], avoid: ['ouça', 'sinta', 'processo longo'] },
    Auditory: { use: ['ouvindo você', 'conversar', 'isso soa bem', 'harmonia', 'ressoar'], avoid: ['veja só', 'olhe', 'imagine'] },
    Kinesthetic: { use: ['sente-se confortável', 'concreto', 'prático', 'impacto', 'experiência'], avoid: ['abstrato', 'teórico', 'conceitual'] },
    Digital: { use: ['faz sentido', 'lógico', 'analisando', 'dados mostram', 'processo'], avoid: ['intuição', 'feeling', 'parece'] }
  };
  return wordSets[vakProfile.dominant] || wordSets.Digital;
}

export function usePreContactBriefing(): PreContactBriefingData {
  const { user } = useAuth();
  const [activeBriefing, setActiveBriefing] = useState<NLPBriefing | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { data: upcomingBriefings = [], isLoading: loading } = useQuery({
    queryKey: ['pre-contact-briefing', user?.id, Array.from(dismissedIds).join(',')],
    queryFn: async () => {
      const now = new Date();
      const in60Minutes = addMinutes(now, 60);

      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions').select('*').eq('user_id', user!.id).eq('follow_up_required', true)
        .not('follow_up_date', 'is', null).in('type', ['call', 'meeting', 'video_call'])
        .order('follow_up_date', { ascending: true })
        .limit(1000);
      if (interactionsError) throw interactionsError;

      const upcomingInteractions = (interactions || []).filter(interaction => {
        if (!interaction.follow_up_date) return false;
        return isWithinInterval(parseISO(interaction.follow_up_date), { start: now, end: in60Minutes });
      });

      if (upcomingInteractions.length === 0) return [];

      const contactIds = [...new Set(upcomingInteractions.map(i => i.contact_id))];
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts').select('*').eq('user_id', user!.id).in('id', contactIds)
        .limit(1000);
      if (contactsError) throw contactsError;
      const contacts = contactsData || [];

      const companyIds = [...new Set(contacts.map(c => c.company_id).filter(Boolean) as string[])];
      const [companiesResult, recentInteractionsResult, valuesResult, objectionsResult, vakResult] = await Promise.all([
        companyIds.length > 0
          ? supabase.from('companies').select('*').in('id', companyIds).limit(200)
          : Promise.resolve({ data: [] as unknown[], error: null }),
        supabase.from('interactions').select('*').eq('user_id', user!.id).in('contact_id', contactIds).order('created_at', { ascending: false }).limit(50),
        supabase.from('client_values').select('*').in('contact_id', contactIds).eq('user_id', user!.id).order('importance', { ascending: false }).limit(100),
        supabase.from('hidden_objections').select('*').in('contact_id', contactIds).eq('user_id', user!.id).eq('resolved', false).limit(100),
        supabase.from('vak_analysis_history').select('*').in('contact_id', contactIds).eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50)
      ]);

      const companies = (companiesResult.data || []) as Record<string, unknown>[];
      const recentInteractions = recentInteractionsResult.data || [];
      const clientValues = valuesResult.data || [];
      const objections = objectionsResult.data || [];
      const vakHistory = vakResult.data || [];
      const contactMap = new Map(contacts.map(c => [c.id, c]));
      const companyMap = new Map(companies.map(c => [c.id, c]));

      return upcomingInteractions
        .filter(interaction => !dismissedIds.has(interaction.id))
        .map(interaction => {
          const contact = contactMap.get(interaction.contact_id);
          if (!contact) return null;
          const company = contact.company_id ? companyMap.get(contact.company_id) || null : null;
          const contactInteractions = recentInteractions.filter(i => i.contact_id === contact.id);
          const texts = contactInteractions.map(i => (i.content || '') + ' ' + (i.transcription || '')).filter(Boolean);

          const storedVAK = vakHistory.find(v => v.contact_id === contact.id);
          let vakProfile: VAKProfile;
          if (storedVAK) {
            const total = (storedVAK.visual_score || 0) + (storedVAK.auditory_score || 0) + (storedVAK.kinesthetic_score || 0) + (storedVAK.digital_score || 0) || 1;
            const scores = { visual: storedVAK.visual_score || 0, auditory: storedVAK.auditory_score || 0, kinesthetic: storedVAK.kinesthetic_score || 0, digital: storedVAK.digital_score || 0 };
            const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
            vakProfile = { visual: Math.round((scores.visual / total) * 100), auditory: Math.round((scores.auditory / total) * 100), kinesthetic: Math.round((scores.kinesthetic / total) * 100), digital: Math.round((scores.digital / total) * 100), dominant: dominant.charAt(0).toUpperCase() + dominant.slice(1) };
          } else {
            vakProfile = analyzeVAK(texts);
          }

          const discProfile = getDISCProfileFromContact(contact);
          const emotionalProfile = analyzeEmotionalState(texts);
          const contactValues = clientValues.filter(v => v.contact_id === contact.id).slice(0, 3).map(v => v.value_name);
          const contactObjections = objections.filter(o => o.contact_id === contact.id).slice(0, 2).map(o => o.objection_type);
          const words = getRecommendedWords(vakProfile);
          const openingTips = generateOpeningTips(vakProfile, discProfile);
          const followUpDate = parseISO(interaction.follow_up_date!);
          const minutesUntil = Math.round((followUpDate.getTime() - now.getTime()) / 60000);
          const lastInteraction = contactInteractions[0];
          const lastSummary = lastInteraction ? `${format(parseISO(lastInteraction.created_at), 'dd/MM')}: ${lastInteraction.title}` : null;

          return {
            contact, company, interaction, vakProfile, discProfile, emotionalProfile,
            topValues: contactValues.length > 0 ? contactValues : ['Não identificados'],
            wordsToUse: words.use, wordsToAvoid: words.avoid, openingTips,
            closingMoment: emotionalProfile.resistanceLevel < 30 ? 'Alto potencial' : emotionalProfile.resistanceLevel < 60 ? 'Moderado' : 'Trabalhar objeções primeiro',
            recentObjections: contactObjections,
            rapportScore: Math.max(0, 100 - emotionalProfile.resistanceLevel),
            lastInteractionSummary: lastSummary, minutesUntilMeeting: minutesUntil
          };
        })
        .filter(Boolean) as NLPBriefing[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Auto-activate first imminent briefing
  if (upcomingBriefings.length > 0 && !activeBriefing) {
    const imminent = upcomingBriefings.find(b => b.minutesUntilMeeting <= 30);
    if (imminent) setActiveBriefing(imminent);
  }

  const dismissBriefing = useCallback((interactionId: string) => {
    setDismissedIds(prev => new Set([...prev, interactionId]));
    if (activeBriefing?.interaction.id === interactionId) setActiveBriefing(null);
  }, [activeBriefing]);

  const showBriefingFor = useCallback((interactionId: string) => {
    const briefing = upcomingBriefings.find(b => b.interaction.id === interactionId);
    if (briefing) setActiveBriefing(briefing);
  }, [upcomingBriefings]);

  return { upcomingBriefings, activeBriefing, loading, dismissBriefing, showBriefingFor };
}
