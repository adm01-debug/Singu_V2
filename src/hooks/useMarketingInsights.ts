import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import type { Tables } from '@/integrations/supabase/types';
import { z } from 'zod';

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

       const data: Pick<Tables<'contact_behavior'>, 'disc_primary' | 'vak_primary' | 'motivation_primary'>[] = [];
       const projection: string = 'id, disc_primary, vak_primary, motivation_primary, contact:contacts!inner(user_id)';
       let afterId: string | undefined;
       while (true) {
         let query = supabase.from('contact_behavior')
           .select(projection)
           .eq('contact.user_id', user.id).order('id', { ascending: true }).limit(1000);
         if (afterId) query = query.gt('id', afterId);
         const { data: page, error } = await query;
         if (error) throw error;
         const rows = z.array(z.object({
           id: z.string(), disc_primary: z.string().nullable(), vak_primary: z.string().nullable(), motivation_primary: z.string().nullable(),
         })).parse(page ?? []);
         data.push(...rows.map(row => ({
           disc_primary: row.disc_primary ?? '',
           vak_primary: row.vak_primary ?? '',
           motivation_primary: row.motivation_primary ?? '',
         })));
         if (rows.length < 1000) break;
         const cursor = rows[rows.length - 1].id;
         if (!cursor) throw new Error('Identificação do perfil comportamental indisponível');
         afterId = cursor;
       }

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
