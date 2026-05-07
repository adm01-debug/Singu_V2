// ==============================================
// useDISCAnalysis Hook - Enterprise Level DISC Analysis
// ==============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Contact, DISCProfile } from '@/types';
import { 
  DISCAnalysisRecord, 
  DISCFullProfile, 
  DISCAnalysisSource,
  DISCDashboardData 
} from '@/types/disc';
import { 
  DISC_PROFILES, 
  DISC_DETECTION_PATTERNS,
  calculateBlendCode,
  getProfileInfo,
  getBlendProfile,
  getCompatibility
} from '@/data/discAdvancedData';
import { toast } from 'sonner';
import { getContactBehavior } from '@/lib/contact-utils';
import { logger } from "@/lib/logger";

interface UseDISCAnalysisReturn {
  // State
  analyzing: boolean;
  latestAnalysis: DISCAnalysisRecord | null;
  analysisHistory: DISCAnalysisRecord[];
  dashboardData: DISCDashboardData | null;
  
  // Actions
  analyzeText: (texts: string[], interactionId?: string) => Promise<DISCAnalysisRecord | null>;
  analyzeContact: (contact: Contact) => Promise<DISCAnalysisRecord | null>;
  fetchAnalysisHistory: () => Promise<void>;
  fetchLatestAnalysis: () => Promise<DISCAnalysisRecord | null>;
  saveManualProfile: (profile: DISCFullProfile, notes?: string) => Promise<void>;
  fetchDashboardData: () => Promise<void>;
  
  // Utilities
  detectProfileFromText: (text: string) => {
    scores: { D: number; I: number; S: number; C: number };
    keywords: string[];
    phrases: string[];
    confidence: number;
  };
  getProfileInfo: typeof getProfileInfo;
  getBlendProfile: typeof getBlendProfile;
  getCompatibility: typeof getCompatibility;
}

export function useDISCAnalysis(contactId?: string): UseDISCAnalysisReturn {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<DISCAnalysisRecord | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<DISCAnalysisRecord[]>([]);
  const [dashboardData, setDashboardData] = useState<DISCDashboardData | null>(null);

  // Text-based profile detection (local, no AI)
  const detectProfileFromText = useCallback((text: string) => {
    const textLower = text.toLowerCase();
    const scores = { D: 0, I: 0, S: 0, C: 0 };
    const foundKeywords: string[] = [];
    const foundPhrases: string[] = [];

    for (const pattern of DISC_DETECTION_PATTERNS) {
      const profileKey = pattern.profile as keyof typeof scores;
      
      // Check regex patterns
      for (const regex of pattern.patterns) {
        const matches = text.match(regex);
        if (matches) {
          scores[profileKey] += matches.length * pattern.weight * 5;
          foundKeywords.push(...matches.map(m => m.toLowerCase()));
        }
      }

      // Check known phrases
      for (const phrase of pattern.phrases) {
        if (textLower.includes(phrase.toLowerCase())) {
          scores[profileKey] += pattern.weight * 10;
          foundPhrases.push(phrase);
        }
      }
    }

    // Normalize scores to 0-100
    const maxScore = Math.max(...Object.values(scores), 1);
    const normalizedScores = {
      D: Math.min(100, Math.round((scores.D / maxScore) * 100)),
      I: Math.min(100, Math.round((scores.I / maxScore) * 100)),
      S: Math.min(100, Math.round((scores.S / maxScore) * 100)),
      C: Math.min(100, Math.round((scores.C / maxScore) * 100))
    };

    // Calculate confidence based on total evidence
    const totalEvidence = foundKeywords.length + foundPhrases.length;
    const confidence = Math.min(95, Math.max(20, totalEvidence * 8));

    return {
      scores: normalizedScores,
      keywords: [...new Set(foundKeywords)],
      phrases: [...new Set(foundPhrases)],
      confidence
    };
  }, []);

  // Analyze texts and create analysis record
  const analyzeText = useCallback(async (
    texts: string[],
    interactionId?: string
  ): Promise<DISCAnalysisRecord | null> => {
    if (!user || !contactId) return null;

    setAnalyzing(true);
    try {
      const combinedText = texts.join(' ');
      const detection = detectProfileFromText(combinedText);
      
      const { primary, secondary, blend } = calculateBlendCode(
        detection.scores.D,
        detection.scores.I,
        detection.scores.S,
        detection.scores.C
      );

      // Generate behavior indicators based on profile
      const profileInfo = DISC_PROFILES[primary];
      const behaviorIndicators = profileInfo?.salesApproach.presentation.slice(0, 3) || [];

      // Generate summary
      const summary = profileInfo 
        ? `Perfil ${profileInfo.name} (${primary}${secondary ? `/${secondary}` : ''}): ${profileInfo.shortDescription}`
        : `Perfil primário identificado: ${primary}`;

      // Save to database
      const { data, error } = await supabase
        .from('disc_analysis_history')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: interactionId || null,
          dominance_score: detection.scores.D,
          influence_score: detection.scores.I,
          steadiness_score: detection.scores.S,
          conscientiousness_score: detection.scores.C,
          primary_profile: primary,
          secondary_profile: secondary,
          blend_profile: blend,
          confidence: detection.confidence,
          analysis_source: 'behavior_tracking',
          detected_keywords: detection.keywords,
          detected_phrases: detection.phrases,
          behavior_indicators: behaviorIndicators,
          analyzed_text: combinedText.slice(0, 5000),
          profile_summary: summary
        })
        .select()
        .single();

      if (error) throw error;

      const record: DISCAnalysisRecord = {
        id: data.id,
        userId: data.user_id,
        contactId: data.contact_id,
        interactionId: data.interaction_id,
        dominanceScore: data.dominance_score,
        influenceScore: data.influence_score,
        steadinessScore: data.steadiness_score,
        conscientiousnessScore: data.conscientiousness_score,
        primaryProfile: data.primary_profile as Exclude<DISCProfile, null>,
        secondaryProfile: data.secondary_profile as Exclude<DISCProfile, null> | null,
        blendProfile: data.blend_profile,
        confidence: data.confidence,
        analysisSource: data.analysis_source as DISCAnalysisSource,
        detectedKeywords: data.detected_keywords as string[] || [],
        detectedPhrases: data.detected_phrases as string[] || [],
        behaviorIndicators: data.behavior_indicators as string[] || [],
        analyzedText: data.analyzed_text,
        profileSummary: data.profile_summary,
        analyzedAt: new Date(data.analyzed_at),
        createdAt: new Date(data.created_at)
      };

      setLatestAnalysis(record);
      setAnalysisHistory(prev => [record, ...prev]);

      // Update contact behavior with new DISC profile
      const { data: contactData } = await supabase
        .from('contacts')
        .select('behavior')
        .eq('id', contactId)
        .maybeSingle();

      const currentBehavior = (contactData?.behavior as Record<string, unknown>) || {};
      await supabase
        .from('contacts')
        .update({
          behavior: {
            ...currentBehavior,
            discProfile: primary,
            discConfidence: detection.confidence
          }
        })
        .eq('id', contactId);

      return record;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('DISC analysis error:', { error: msg });
      toast.error('Erro na análise DISC');
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [user, contactId, detectProfileFromText]);

  // Analyze contact based on all their interactions
  const analyzeContact = useCallback(async (contact: Contact): Promise<DISCAnalysisRecord | null> => {
    if (!user) return null;

    setAnalyzing(true);
    try {
      // Fetch all interactions for this contact
      const { data: interactions } = await supabase
        .from('interactions')
        .select('content, transcription')
        .eq('contact_id', contact.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!interactions || interactions.length === 0) {
        toast.warning('Sem interações para analisar');
        return null;
      }

      const texts = interactions
        .map(i => [i.content, i.transcription].filter(Boolean).join(' '))
        .filter(t => t.length > 10);

      if (texts.length === 0) {
        toast.warning('Textos insuficientes para análise');
        return null;
      }

      return await analyzeText(texts);
    } finally {
      setAnalyzing(false);
    }
  }, [user, analyzeText]);

  // Fetch analysis history for contact
  const fetchAnalysisHistory = useCallback(async () => {
    if (!user || !contactId) return;

    try {
      const { data, error } = await supabase
        .from('disc_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('analyzed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const records: DISCAnalysisRecord[] = (data || []).map(d => ({
        id: d.id,
        userId: d.user_id,
        contactId: d.contact_id,
        interactionId: d.interaction_id,
        dominanceScore: d.dominance_score,
        influenceScore: d.influence_score,
        steadinessScore: d.steadiness_score,
        conscientiousnessScore: d.conscientiousness_score,
        primaryProfile: d.primary_profile as Exclude<DISCProfile, null>,
        secondaryProfile: d.secondary_profile as Exclude<DISCProfile, null> | null,
        blendProfile: d.blend_profile,
        stressPrimary: d.stress_primary as Exclude<DISCProfile, null> | undefined,
        stressSecondary: d.stress_secondary as Exclude<DISCProfile, null> | null | undefined,
        confidence: d.confidence,
        analysisSource: d.analysis_source as DISCAnalysisSource,
        detectedKeywords: d.detected_keywords as string[] || [],
        detectedPhrases: d.detected_phrases as string[] || [],
        behaviorIndicators: d.behavior_indicators as string[] || [],
        analyzedText: d.analyzed_text,
        analysisNotes: d.analysis_notes,
        profileSummary: d.profile_summary,
        analyzedAt: new Date(d.analyzed_at),
        createdAt: new Date(d.created_at)
      }));

      setAnalysisHistory(records);
      if (records.length > 0) {
        setLatestAnalysis(records[0]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error fetching DISC history:', { error: msg });
    }
  }, [user, contactId]);

  // Fetch latest analysis
  const fetchLatestAnalysis = useCallback(async (): Promise<DISCAnalysisRecord | null> => {
    if (!user || !contactId) return null;

    try {
      const { data, error } = await supabase
        .from('disc_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const record: DISCAnalysisRecord = {
        id: data.id,
        userId: data.user_id,
        contactId: data.contact_id,
        interactionId: data.interaction_id,
        dominanceScore: data.dominance_score,
        influenceScore: data.influence_score,
        steadinessScore: data.steadiness_score,
        conscientiousnessScore: data.conscientiousness_score,
        primaryProfile: data.primary_profile as Exclude<DISCProfile, null>,
        secondaryProfile: data.secondary_profile as Exclude<DISCProfile, null> | null,
        blendProfile: data.blend_profile,
        confidence: data.confidence,
        analysisSource: data.analysis_source as DISCAnalysisSource,
        detectedKeywords: data.detected_keywords as string[] || [],
        detectedPhrases: data.detected_phrases as string[] || [],
        behaviorIndicators: data.behavior_indicators as string[] || [],
        analyzedText: data.analyzed_text,
        profileSummary: data.profile_summary,
        analyzedAt: new Date(data.analyzed_at),
        createdAt: new Date(data.created_at)
      };

      setLatestAnalysis(record);
      return record;
    } catch (err) {
      logger.error('Error fetching latest DISC analysis:', err);
      return null;
    }
  }, [user, contactId]);

  // Save manual profile
  const saveManualProfile = useCallback(async (
    profile: DISCFullProfile,
    notes?: string
  ): Promise<void> => {
    if (!user || !contactId) return;

    try {
      const { primary, secondary, blend } = calculateBlendCode(
        profile.scores.dominance,
        profile.scores.influence,
        profile.scores.steadiness,
        profile.scores.conscientiousness
      );

      const profileInfo = DISC_PROFILES[primary];
      const summary = `Perfil ${profileInfo?.name || primary} definido manualmente`;

      const { data, error } = await supabase
        .from('disc_analysis_history')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          dominance_score: profile.scores.dominance,
          influence_score: profile.scores.influence,
          steadiness_score: profile.scores.steadiness,
          conscientiousness_score: profile.scores.conscientiousness,
          primary_profile: primary,
          secondary_profile: secondary,
          blend_profile: blend,
          stress_primary: profile.stressPrimary || null,
          stress_secondary: profile.stressSecondary || null,
          confidence: 100,
          analysis_source: 'manual',
          analysis_notes: notes,
          profile_summary: summary,
          detected_keywords: [],
          detected_phrases: [],
          behavior_indicators: []
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Perfil DISC salvo com sucesso');
      await fetchAnalysisHistory();
    } catch (err) {
      logger.error('Error saving manual DISC profile:', err);
      toast.error('Erro ao salvar perfil DISC');
    }
  }, [user, contactId, fetchAnalysisHistory]);

  // Fetch dashboard data (portfolio overview)
  const fetchDashboardData = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      // Fetch all contacts with behavior
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, behavior, relationship_score')
        .eq('user_id', user.id);

      // Fetch recent analyses
      const { data: recentAnalyses } = await supabase
        .from('disc_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(10);

      // Calculate distributions
      const profileCounts = { D: 0, I: 0, S: 0, C: 0 };
      const blendCounts: Record<string, number> = {};
      let profiledCount = 0;
      let totalConfidence = 0;
      let confidenceCount = 0;

      for (const contact of contacts || []) {
        const behavior = getContactBehavior(contact);
        const profile = behavior?.discProfile as DISCProfile;
        
        if (profile && profile in profileCounts) {
          profileCounts[profile as keyof typeof profileCounts]++;
          profiledCount++;
        }
      }

      for (const analysis of recentAnalyses || []) {
        if (analysis.blend_profile) {
          blendCounts[analysis.blend_profile] = (blendCounts[analysis.blend_profile] || 0) + 1;
        }
        totalConfidence += analysis.confidence;
        confidenceCount++;
      }

      const totalContacts = contacts?.length || 0;
      const portfolioDistribution = (['D', 'I', 'S', 'C'] as const).map(profile => ({
        profile,
        count: profileCounts[profile],
        percentage: totalContacts > 0 ? Math.round((profileCounts[profile] / totalContacts) * 100) : 0
      }));

      const blendDistribution = Object.entries(blendCounts)
        .map(([blend, count]) => ({
          blend,
          count,
          percentage: profiledCount > 0 ? Math.round((count / profiledCount) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      setDashboardData({
        portfolioDistribution,
        blendDistribution,
        conversionByProfile: portfolioDistribution.map(p => ({
          profile: p.profile,
          rate: 0, // Would need actual conversion data
          trend: 'stable' as const
        })),
        compatibilityInsights: {
          bestPerforming: portfolioDistribution.sort((a, b) => b.count - a.count)[0]?.profile || 'I',
          needsImprovement: portfolioDistribution.sort((a, b) => a.count - b.count)[0]?.profile || 'C',
          avgCompatibilityScore: 70
        },
        recentAnalyses: (recentAnalyses || []).map(d => ({
          id: d.id,
          userId: d.user_id,
          contactId: d.contact_id,
          interactionId: d.interaction_id,
          dominanceScore: d.dominance_score,
          influenceScore: d.influence_score,
          steadinessScore: d.steadiness_score,
          conscientiousnessScore: d.conscientiousness_score,
          primaryProfile: d.primary_profile as Exclude<DISCProfile, null>,
          secondaryProfile: d.secondary_profile as Exclude<DISCProfile, null> | null,
          blendProfile: d.blend_profile,
          confidence: d.confidence,
          analysisSource: d.analysis_source as DISCAnalysisSource,
          detectedKeywords: d.detected_keywords as string[] || [],
          detectedPhrases: d.detected_phrases as string[] || [],
          behaviorIndicators: d.behavior_indicators as string[] || [],
          analyzedText: d.analyzed_text,
          profileSummary: d.profile_summary,
          analyzedAt: new Date(d.analyzed_at),
          createdAt: new Date(d.created_at)
        })),
        profiledContacts: profiledCount,
        totalContacts,
        coveragePercentage: totalContacts > 0 ? Math.round((profiledCount / totalContacts) * 100) : 0,
        averageConfidence: confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0
      });
    } catch (err) {
      logger.error('Error fetching DISC dashboard data:', err);
    }
  }, [user]);

  return {
    analyzing,
    latestAnalysis,
    analysisHistory,
    dashboardData,
    analyzeText,
    analyzeContact,
    fetchAnalysisHistory,
    fetchLatestAnalysis,
    saveManualProfile,
    fetchDashboardData,
    detectProfileFromText,
    getProfileInfo,
    getBlendProfile,
    getCompatibility
  };
}
