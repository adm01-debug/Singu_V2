import { useState, useEffect, useMemo, useCallback } from 'react';
import { z } from 'zod';
import { VAKType, VAK_LABELS } from '@/types/vak';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  SalespersonProfile,
  ContactWithCompatibility,
  PortfolioStats,
  DISC_COMPATIBILITY,
  VAK_COMPATIBILITY,
  getDISCAdaptation,
} from '@/components/triggers/portfolio/portfolioTypes';

const discProfileSchema = z.enum(['D', 'I', 'S', 'C']);
const salespersonProfileSchema = z.object({
  vakProfile: z.enum(['V', 'A', 'K', 'D']).nullish(),
  discProfile: discProfileSchema.nullish(),
  metaprograms: z.object({
    motivationDirection: z.string().nullish(), referenceFrame: z.string().nullish(),
    workingStyle: z.string().nullish(), chunkSize: z.string().nullish(),
    actionFilter: z.string().nullish(), comparisonStyle: z.string().nullish(),
  }).nullish(),
});

function normalizeSalespersonProfile(value: unknown): SalespersonProfile | null {
  if (value === null || value === undefined) return null;
  const profile = salespersonProfileSchema.parse(value);
  return {
    vakProfile: profile.vakProfile ?? null, discProfile: profile.discProfile ?? null,
    metaprograms: {
      motivationDirection: profile.metaprograms?.motivationDirection ?? null,
      referenceFrame: profile.metaprograms?.referenceFrame ?? null,
      workingStyle: profile.metaprograms?.workingStyle ?? null,
      chunkSize: profile.metaprograms?.chunkSize ?? null,
      actionFilter: profile.metaprograms?.actionFilter ?? null,
      comparisonStyle: profile.metaprograms?.comparisonStyle ?? null,
    },
  };
}

export function usePortfolioCompatibility() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [salespersonProfile, setSalespersonProfile] = useState<SalespersonProfile | null>(null);
  const [contacts, setContacts] = useState<ContactWithCompatibility[]>([]);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'compatibility' | 'name' | 'relationship'>('compatibility');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    results: fuzzyResults,
    isSearching,
    clearSearch,
  } = useFuzzySearch(contacts, {
    keys: ['firstName', 'lastName', 'company'],
    threshold: 0.3,
    minChars: 1,
  });

  const loadData = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);

    try {
      // All 4 queries are independent — run in parallel
      const [
        { data: profileData, error: profileError },
        { data: contactsData, error },
        { data: vakData, error: vakError },
        { data: metaData, error: metaError },
      ] = await Promise.all([
        supabase.from('profiles').select('nlp_profile').eq('id', user.id).maybeSingle(),
        supabase.from('contacts').select('id, first_name, last_name, behavior, relationship_score, company_id').eq('user_id', user.id).limit(2000),
        supabase.from('vak_analysis_history').select('contact_id, visual_score, auditory_score, kinesthetic_score, digital_score').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5000),
        supabase.from('metaprogram_analysis').select('contact_id, toward_score, away_from_score, internal_score, external_score, options_score, procedures_score').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5000),
      ]);

      if (signal?.cancelled) return;
      if (error) throw error;
      if (profileError) throw profileError;
      if (vakError) throw vakError;
      if (metaError) throw metaError;

      const companyIds = [...new Set((contactsData ?? []).flatMap(c => c.company_id ? [c.company_id] : []))];
      const companyNames = new Map<string, string>();
      for (let offset = 0; offset < companyIds.length; offset += 500) {
        const { data: companies, error: companiesError } = await supabase
          .from('companies').select('id, nome_crm').in('id', companyIds.slice(offset, offset + 500)).eq('user_id', user.id);
        if (signal?.cancelled) return;
        if (companiesError) throw companiesError;
        for (const company of companies ?? []) companyNames.set(company.id, company.nome_crm);
      }

      const spProfile = normalizeSalespersonProfile(profileData?.nlp_profile);
      setSalespersonProfile(spProfile);

      const vakMap = new Map<string, VAKType>();
      vakData?.forEach((v) => {
        if (!vakMap.has(v.contact_id)) {
          const scores = { V: v.visual_score || 0, A: v.auditory_score || 0, K: v.kinesthetic_score || 0, D: v.digital_score || 0 };
          const primary = (Object.entries(scores) as [VAKType, number][]).sort(([, a], [, b]) => b - a)[0][0];
          vakMap.set(v.contact_id, primary);
        }
      });

      const metaMap = new Map<string, { motivation: string; reference: string; working: string }>();
      metaData?.forEach((m) => {
        if (!metaMap.has(m.contact_id)) {
          metaMap.set(m.contact_id, {
            motivation: (m.toward_score || 0) > (m.away_from_score || 0) ? 'toward' : 'away_from',
            reference: (m.internal_score || 0) > (m.external_score || 0) ? 'internal' : 'external',
            working: (m.options_score || 0) > (m.procedures_score || 0) ? 'options' : 'procedures',
          });
        }
      });

      const contactsWithCompatibility: ContactWithCompatibility[] = (contactsData || []).map((c) => {
        const behavior = z.object({ discProfile: discProfileSchema.nullish(), disc_profile: discProfileSchema.nullish() }).parse(c.behavior ?? {});
        const discProfile = behavior?.discProfile || behavior?.disc_profile || null;
        const vakProfile = vakMap.get(c.id) || null;
        const metaProfile = metaMap.get(c.id);

        let discScore = 0, vakScore = 0, metaprogramScore = 0;
        const opportunities: string[] = [];
        const challenges: string[] = [];

        if (spProfile?.discProfile && discProfile) {
          discScore = DISC_COMPATIBILITY[spProfile.discProfile][discProfile];
          if (discScore >= 80) opportunities.push(`Perfil ${discProfile} tem ótima sintonia com você (${spProfile.discProfile})`);
          else if (discScore < 60) challenges.push(`Adapte-se ao perfil ${discProfile}: ${getDISCAdaptation(spProfile.discProfile, discProfile)}`);
        }

        if (spProfile?.vakProfile && vakProfile) {
          vakScore = VAK_COMPATIBILITY[spProfile.vakProfile][vakProfile];
          if (vakScore >= 80) opportunities.push(`Comunicação ${VAK_LABELS[vakProfile].name} alinhada com a sua`);
          else if (vakScore < 70) challenges.push(`Use mais linguagem ${VAK_LABELS[vakProfile].name.toLowerCase()} nas conversas`);
        }

        if (spProfile?.metaprograms && metaProfile) {
          let metaMatches = 0, metaTotal = 0;
          if (spProfile.metaprograms.motivationDirection && metaProfile.motivation) {
            metaTotal++;
            if (spProfile.metaprograms.motivationDirection === metaProfile.motivation) {
              metaMatches++;
              opportunities.push(`Motivação alinhada: foco em ${metaProfile.motivation === 'toward' ? 'ganhos' : 'evitar problemas'}`);
            } else {
              challenges.push(`Ajuste a motivação: cliente foca em ${metaProfile.motivation === 'toward' ? 'objetivos' : 'evitar problemas'}`);
            }
          }
          if (spProfile.metaprograms.referenceFrame && metaProfile.reference) { metaTotal++; if (spProfile.metaprograms.referenceFrame === metaProfile.reference) metaMatches++; }
          if (spProfile.metaprograms.workingStyle && metaProfile.working) { metaTotal++; if (spProfile.metaprograms.workingStyle === metaProfile.working) metaMatches++; }
          metaprogramScore = metaTotal > 0 ? Math.round((metaMatches / metaTotal) * 100) : 0;
        }

        const scores = [discScore, vakScore, metaprogramScore].filter(s => s > 0);
        const compatibilityScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        let level: ContactWithCompatibility['level'];
        if (compatibilityScore >= 80) level = 'excellent';
        else if (compatibilityScore >= 65) level = 'good';
        else if (compatibilityScore >= 45) level = 'moderate';
        else level = 'challenging';

        return {
          id: c.id, firstName: c.first_name, lastName: c.last_name,
          company: c.company_id ? companyNames.get(c.company_id) : undefined,
          discProfile, vakProfile, compatibilityScore, discScore, vakScore, metaprogramScore,
          level, opportunities, challenges, relationshipScore: c.relationship_score,
        };
      });

      if (!signal?.cancelled) setContacts(contactsWithCompatibility);
    } catch (error) {
      if (!signal?.cancelled) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error loading portfolio data:', { error: msg });
        toast.error('Erro ao carregar dados', { description: msg });
        setLoadError(error);
      }
      throw error;
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const signal = { cancelled: false };
    loadData(signal).catch(error => {
      if (!signal.cancelled) setLoadError(error);
    });
    return () => { signal.cancelled = true; };
  }, [user, loadData]);

  const filteredContacts = useMemo(() => {
    let result = [...fuzzyResults];
    if (filterLevel !== 'all') result = result.filter((c) => c.level === filterLevel);
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'compatibility') comparison = a.compatibilityScore - b.compatibilityScore;
      else if (sortBy === 'name') comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      else if (sortBy === 'relationship') comparison = (a.relationshipScore || 0) - (b.relationshipScore || 0);
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    return result;
  }, [fuzzyResults, filterLevel, sortBy, sortOrder]);

  const stats = useMemo<PortfolioStats>(() => {
    const withProfile = contacts.filter((c) => c.compatibilityScore > 0);
    return {
      total: withProfile.length,
      excellent: contacts.filter((c) => c.level === 'excellent').length,
      good: contacts.filter((c) => c.level === 'good').length,
      moderate: contacts.filter((c) => c.level === 'moderate').length,
      challenging: contacts.filter((c) => c.level === 'challenging').length,
      averageCompatibility: withProfile.length > 0 ? Math.round(withProfile.reduce((sum, c) => sum + c.compatibilityScore, 0) / withProfile.length) : 0,
      topOpportunities: contacts.filter((c) => c.level === 'excellent' || c.level === 'good').sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 5),
      needsAttention: contacts.filter((c) => c.level === 'challenging').sort((a, b) => a.compatibilityScore - b.compatibilityScore).slice(0, 5),
    };
  }, [contacts]);

  return {
    loading, error: loadError, salespersonProfile, contacts, filteredContacts, stats,
    expandedContact, setExpandedContact,
    filterLevel, setFilterLevel,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    searchTerm, setSearchTerm, isSearching, clearSearch,
    loadData,
  };
}
