import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LeadScoreCard } from './LeadScoreCard';

interface Props {
  contactId: string;
}

/**
 * Self-contained widget that gathers all contact data needed for lead scoring
 * and renders the LeadScoreCard with computed inputs.
 */
function LeadScoreWidgetInner({ contactId }: Props) {
  const { user } = useAuth();

  const { data: contactData } = useQuery({
    queryKey: ['lead-score-inputs', contactId, user?.id],
    queryFn: async () => {
      if (!contactId || !user?.id) return null;

      const [
        contactRes,
        interactionsRes,
        discRes,
        eqRes,
        vakRes,
        metaRes,
        dealsRes,
        objectionsRes,
        cadenceRes,
        rapportRes,
      ] = await Promise.all([
        supabase.from('contacts').select('relationship_score, email, phone, birthday, company_id, linkedin, instagram, twitter, whatsapp, role, interests, hobbies, notes').eq('id', contactId).maybeSingle(),
        supabase.from('interactions').select('id, created_at').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50),
        supabase.from('disc_analysis_history').select('id').eq('contact_id', contactId).limit(1),
        supabase.from('eq_analysis_history').select('id').eq('contact_id', contactId).limit(1),
        supabase.from('vak_analysis_history').select('id').eq('contact_id', contactId).limit(1),
        supabase.from('metaprogram_analysis').select('id').eq('contact_id', contactId).limit(1),
        // Check pipeline for active deals - use a simple approach
        supabase.from('interactions').select('id').eq('contact_id', contactId).eq('type', 'deal').limit(10),
        supabase.from('hidden_objections').select('id').eq('contact_id', contactId).eq('resolved', false),
        supabase.from('contact_cadence').select('next_contact_due, last_contact_at').eq('contact_id', contactId).maybeSingle(),
        supabase.from('score_history').select('score_value').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(1),
      ]);

      const contact = contactRes.data;
      const interactions = interactionsRes.data ?? [];
      const lastInteractionDate = interactions[0]?.created_at;
      const lastInteractionDays = lastInteractionDate
        ? Math.floor((Date.now() - new Date(lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Profile completeness
      const fields = [
        contact?.email, contact?.phone, contact?.birthday, contact?.company_id,
        contact?.linkedin, contact?.instagram, contact?.role, contact?.interests,
        contact?.hobbies, contact?.notes, contact?.whatsapp, contact?.twitter,
      ];
      const filledFields = fields.filter(f => f !== null && f !== undefined && f !== '').length;
      const profileCompleteness = Math.round((filledFields / fields.length) * 100);

      // Cadence on track
      const cadence = cadenceRes.data;
      const cadenceOnTrack = cadence?.next_contact_due
        ? new Date(cadence.next_contact_due) >= new Date()
        : false;

      return {
        id: contactId,
        relationship_score: contact?.relationship_score ?? null,
        interactions_count: interactions.length,
        last_interaction_days: lastInteractionDays,
        has_disc: (discRes.data?.length ?? 0) > 0,
        has_eq: (eqRes.data?.length ?? 0) > 0,
        has_vak: (vakRes.data?.length ?? 0) > 0,
        has_metaprogram: (metaRes.data?.length ?? 0) > 0,
        profile_completeness: profileCompleteness,
        active_deals: dealsRes.data?.length ?? 0,
        deal_stage_max: dealsRes.data && dealsRes.data.length > 0 ? 2 : 0,
        response_rate: interactions.length > 0 ? Math.min(100, interactions.length * 8) : 0,
        rapport_score: rapportRes.data?.[0]?.score_value ? Number(rapportRes.data[0].score_value) : null,
        churn_risk: null,
        hidden_objections_count: objectionsRes.data?.length ?? 0,
        cadence_on_track: cadenceOnTrack,
      };
    },
    enabled: !!contactId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return <LeadScoreCard contactId={contactId} contactData={contactData ?? undefined} />;
}

export const LeadScoreWidget = memo(LeadScoreWidgetInner);
