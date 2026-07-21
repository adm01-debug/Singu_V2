import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface SalespersonProfile {
  vakProfile: VAKType | null;
  discProfile: DISCProfile | null;
  metaprograms: {
    motivationDirection: string | null;
    referenceFrame: string | null;
    workingStyle: string | null;
  };
}

interface CompatibilitySettings {
  alert_threshold: number;
  alert_only_important: boolean;
  important_min_relationship_score: number;
}

// DISC Compatibility Matrix
const DISC_COMPATIBILITY: Record<DISCProfile, Record<DISCProfile, number>> = {
  D: { D: 60, I: 85, S: 50, C: 70 },
  I: { D: 85, I: 70, S: 80, C: 55 },
  S: { D: 50, I: 80, S: 75, C: 85 },
  C: { D: 70, I: 55, S: 85, C: 65 },
};

// VAK Compatibility
const VAK_COMPATIBILITY: Record<VAKType, Record<VAKType, number>> = {
  V: { V: 100, A: 70, K: 60, D: 75 },
  A: { V: 70, A: 100, K: 65, D: 80 },
  K: { V: 60, A: 65, K: 100, D: 55 },
  D: { V: 75, A: 80, K: 55, D: 100 },
};

export function useCompatibilityAlerts() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkAndCreateAlerts = useCallback(async () => {
    if (!user) return;

    setChecking(true);
    try {
      // Stage 1: fetch settings and salesperson profile in parallel
      const [{ data: settingsData }, { data: profileData }] = await Promise.all([
        supabase.from('compatibility_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('nlp_profile').eq('id', user.id).maybeSingle(),
      ]);

      const settings: CompatibilitySettings = {
        alert_threshold: settingsData?.alert_threshold ?? 50,
        alert_only_important: settingsData?.alert_only_important ?? true,
        important_min_relationship_score: settingsData?.important_min_relationship_score ?? 70,
      };

      const salespersonProfile = profileData?.nlp_profile as unknown as SalespersonProfile | null;

      if (!salespersonProfile?.discProfile && !salespersonProfile?.vakProfile) {
        return; // No profile configured
      }

      // Stage 2: contacts, existing alerts, and VAK data are all independent — run in parallel
      const [{ data: contacts }, { data: existingAlerts }, { data: vakData }] = await Promise.all([
        supabase.from('contacts').select('id, first_name, last_name, behavior, relationship_score').eq('user_id', user.id).limit(1000),
        supabase.from('compatibility_alerts').select('contact_id').eq('user_id', user.id).eq('dismissed', false).limit(500),
        supabase.from('vak_analysis_history').select('contact_id, visual_score, auditory_score, kinesthetic_score, digital_score').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2000),
      ]);

      if (!contacts) return;

      const existingAlertContactIds = new Set(existingAlerts?.map(a => a.contact_id) || []);

      const vakMap = new Map<string, VAKType>();
      vakData?.forEach((v) => {
        if (!vakMap.has(v.contact_id)) {
          const scores = {
            V: v.visual_score || 0,
            A: v.auditory_score || 0,
            K: v.kinesthetic_score || 0,
            D: v.digital_score || 0,
          };
          const primary = (Object.entries(scores) as [VAKType, number][])
            .sort(([,a], [,b]) => b - a)[0][0];
          vakMap.set(v.contact_id, primary);
        }
      });

      // 6. Calculate compatibility and create alerts
      const newAlerts: Array<{
        user_id: string;
        contact_id: string;
        compatibility_score: number;
        threshold: number;
        title: string;
        description: string;
      }> = [];

      for (const contact of contacts) {
        // Skip if already has an alert
        if (existingAlertContactIds.has(contact.id)) continue;

        // Check if important filter applies
        if (settings.alert_only_important) {
          const relationshipScore = contact.relationship_score || 0;
          if (relationshipScore < settings.important_min_relationship_score) continue;
        }

        // Calculate compatibility
        const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
        const contactDISC = behavior?.discProfile || null;
        const contactVAK = vakMap.get(contact.id) || null;

        let totalScore = 0;
        let factors = 0;

        if (salespersonProfile.discProfile && contactDISC) {
          totalScore += DISC_COMPATIBILITY[salespersonProfile.discProfile][contactDISC];
          factors++;
        }

        if (salespersonProfile.vakProfile && contactVAK) {
          totalScore += VAK_COMPATIBILITY[salespersonProfile.vakProfile][contactVAK];
          factors++;
        }

        const compatibilityScore = factors > 0 ? Math.round(totalScore / factors) : 0;

        // Create alert if below threshold
        if (compatibilityScore > 0 && compatibilityScore < settings.alert_threshold) {
          newAlerts.push({
            user_id: user.id,
            contact_id: contact.id,
            compatibility_score: compatibilityScore,
            threshold: settings.alert_threshold,
            title: `Compatibilidade baixa com ${contact.first_name} ${contact.last_name}`,
            description: `A compatibilidade está em ${compatibilityScore}%, abaixo do limite de ${settings.alert_threshold}%. Considere revisar sua estratégia de comunicação.`,
          });
        }
      }

      // 7. Insert new alerts
      if (newAlerts.length > 0) {
        const { error } = await supabase
          .from('compatibility_alerts')
          .insert(newAlerts);

        if (!error) {
          toast.warning(`${newAlerts.length} novo(s) alerta(s) de compatibilidade`, {
            description: 'Alguns clientes importantes estão abaixo do limite configurado.',
          });
        }
      }

    } catch (err) {
      logger.error('Error checking compatibility alerts:', err);
    } finally {
      setChecking(false);
    }
  }, [user]);

  // Auto-check on mount
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const scheduleCheck = () => {
      void checkAndCreateAlerts();
    };

    const timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        const idleId = window.requestIdleCallback(scheduleCheck, { timeout: 5000 });
        return () => window.cancelIdleCallback(idleId);
      }

      scheduleCheck();
      return undefined;
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [checkAndCreateAlerts, user]);

  return {
    checking,
    checkAndCreateAlerts,
  };
}
