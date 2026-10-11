import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

 export interface FunnelStat {
   stage: string;
   count: number;
   previous_stage_count: number;
   conversion_rate: number;
 }

 export interface CampaignStat {
   id: string;
   entity_type: string;
   entity_id: string;
   date: string;
   views: number;
   clicks: number;
   submissions: number;
   conversions: number;
   spend: number;
   revenue: number;
 }

 export function useMarketingFunnel(startDate?: string, endDate?: string) {
   const { user } = useAuth();
   return useQuery({
     queryKey: ['marketing-funnel', startDate, endDate, user?.id],
     enabled: !!user,
     staleTime: 10 * 60_000,
     refetchOnWindowFocus: false,
     queryFn: async () => {
       if (!user) return [];

       const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
       const end = endDate || new Date().toISOString().split('T')[0];

       const { data, error } = await supabase.rpc('get_marketing_funnel_stats', {
         _user_id: user.id,
         _start_date: start,
         _end_date: end
       });

       if (error) {
         logger.error('Error fetching marketing funnel:', error);
         throw error;
       }
       return data ?? [];
     },
   });
 }

 export function useMarketingBehavioralInsights() {
   const { user } = useAuth();
   return useQuery({
     queryKey: ['marketing-behavioral-insights', user?.id],
     enabled: !!user,
     staleTime: 10 * 60_000,
     refetchOnWindowFocus: false,
     queryFn: async () => {
       if (!user) return null;

       const { data: contacts, error: contactsError } = await supabase
         .from('contacts').select('id').eq('user_id', user.id);
       if (contactsError) throw contactsError;
       const contactIds = (contacts ?? []).map(contact => contact.id);
       const { data, error } = contactIds.length > 0
         ? await supabase.from('contact_behavior')
           .select('disc_primary, vak_primary, motivation_primary').in('contact_id', contactIds)
         : { data: [], error: null };
       if (error) throw error;

       type BehavioralStats = {
         disc: Record<string, number>;
         vak: Record<string, number>;
         motivation: Record<string, number>;
       };
       const stats = (data || []).reduce<BehavioralStats>((acc, behavior) => {
          if (behavior?.disc_primary) acc.disc[behavior.disc_primary] = (acc.disc[behavior.disc_primary] || 0) + 1;
          if (behavior?.vak_primary) acc.vak[behavior.vak_primary] = (acc.vak[behavior.vak_primary] || 0) + 1;
          if (behavior?.motivation_primary) {
            acc.motivation[behavior.motivation_primary] = (acc.motivation[behavior.motivation_primary] || 0) + 1;
          }
          return acc;
        }, { disc: {}, vak: {}, motivation: {} });

       return stats;
     },
   });
 }

 export function useMarketingCampaignStats() {
   const { user } = useAuth();
   return useQuery({
     queryKey: ['marketing-campaign-stats', user?.id],
     enabled: !!user,
     staleTime: 10 * 60_000,
     refetchOnWindowFocus: false,
     queryFn: async () => {
       if (!user) return [];

       const { data, error } = await supabase
        .from('marketing_campaign_stats')
        .select('id, entity_type, entity_id, date, views, clicks, submissions, conversions, spend, revenue')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

       if (error) {
         logger.error('Error fetching campaign stats:', error);
         throw error;
       }
       return data ?? [];
     },
   });
 }
