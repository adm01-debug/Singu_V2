import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DISCProfile } from '@/types';
import { logger } from '@/lib/logger';

export interface ProfileMetrics {
  profile: Exclude<DISCProfile, null>;
  totalContacts: number;
  opportunities: number;
  conversions: number;
  conversionRate: number;
  avgDealValue: number;
  avgCycleDays: number;
  avgRelationshipScore: number;
  trend: 'up' | 'down' | 'stable';
}

export type ConversionPeriod = '30d' | '90d' | '180d' | '365d';

export function useDISCConversionData(period: ConversionPeriod) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ProfileMetrics[]>([]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let cancelled = false;
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Both queries are independent — run in parallel
        const [{ data: contacts }, { data: interactions }] = await Promise.all([
          supabase.from('contacts').select('id, behavior, relationship_score, relationship_stage, created_at').eq('user_id', currentUser.id).limit(1000),
          supabase.from('interactions').select('contact_id, type, created_at').eq('user_id', currentUser.id).order('created_at', { ascending: true }).limit(5000),
        ]);

        if (cancelled) return;

        const profileData: Record<string, {
          contacts: number; opportunities: number; conversions: number;
          totalValue: number; totalCycleDays: number; totalRelationshipScore: number; closedCount: number;
        }> = {
          D: { contacts: 0, opportunities: 0, conversions: 0, totalValue: 0, totalCycleDays: 0, totalRelationshipScore: 0, closedCount: 0 },
          I: { contacts: 0, opportunities: 0, conversions: 0, totalValue: 0, totalCycleDays: 0, totalRelationshipScore: 0, closedCount: 0 },
          S: { contacts: 0, opportunities: 0, conversions: 0, totalValue: 0, totalCycleDays: 0, totalRelationshipScore: 0, closedCount: 0 },
          C: { contacts: 0, opportunities: 0, conversions: 0, totalValue: 0, totalCycleDays: 0, totalRelationshipScore: 0, closedCount: 0 },
        };

        (contacts || []).forEach(contact => {
          const behavior = contact.behavior as Record<string, unknown> | null;
          const discProfile = (behavior?.discProfile || behavior?.disc) as Exclude<DISCProfile, null> | undefined;
          if (!discProfile || !profileData[discProfile]) return;

          profileData[discProfile].contacts++;
          profileData[discProfile].totalRelationshipScore += contact.relationship_score || 0;

          const stage = contact.relationship_stage;
          if (stage === 'negociando' || stage === 'proposta' || stage === 'fechado') {
            profileData[discProfile].opportunities++;
          }
          if (stage === 'fechado' || stage === 'cliente') {
            profileData[discProfile].conversions++;
            profileData[discProfile].closedCount++;
          }

          // eslint-disable-next-line sonarjs/no-nested-functions
          const contactInteractions = (interactions || []).filter(i => i.contact_id === contact.id);
          if (contactInteractions.length >= 2) {
            const firstDate = new Date(contactInteractions[0].created_at);
            const lastDate = new Date(contactInteractions[contactInteractions.length - 1].created_at);
            const cycleDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
            if (cycleDays > 0) profileData[discProfile].totalCycleDays += cycleDays;
          }
        });

        const calculatedMetrics: ProfileMetrics[] = (['D', 'I', 'S', 'C'] as const).map(profile => {
          const data = profileData[profile];
          const conversionRate = data.opportunities > 0 ? Math.round((data.conversions / data.opportunities) * 100) : 0;
          const avgDealValue = data.closedCount > 0 ? Math.round(data.totalValue / data.closedCount) : 0;
          const avgCycleDays = data.closedCount > 0 ? Math.round(data.totalCycleDays / data.closedCount) : 0;
          const avgRelationshipScore = data.contacts > 0 ? Math.round(data.totalRelationshipScore / data.contacts) : 0;
          const trend: 'up' | 'down' | 'stable' = conversionRate >= 60 ? 'up' : conversionRate >= 30 ? 'stable' : 'down';
          return { profile, totalContacts: data.contacts, opportunities: data.opportunities, conversions: data.conversions, conversionRate, avgDealValue, avgCycleDays, avgRelationshipScore, trend };
        });

        setMetrics(calculatedMetrics);
      } catch (error) {
        if (cancelled) return;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching conversion metrics:', { error: msg });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMetrics();
    return () => { cancelled = true; };
  }, [user, period]);

  const bestProfile = useMemo(() =>
    metrics.reduce((best, curr) => curr.conversionRate > (best?.conversionRate || 0) ? curr : best, metrics[0]),
    [metrics]
  );

  return { metrics, loading, bestProfile };
}
