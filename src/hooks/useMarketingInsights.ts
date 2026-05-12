 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 
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
   return useQuery({
     queryKey: ['marketing-funnel', startDate, endDate],
     queryFn: async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return [];
 
       const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
       const end = endDate || new Date().toISOString().split('T')[0];
 
       const { data, error } = await supabase.rpc('get_marketing_funnel_stats', {
         _user_id: user.id,
         _start_date: start,
         _end_date: end
       });
 
       if (error) throw error;
       return data as FunnelStat[];
     },
   });
 }
 
 export function useMarketingCampaignStats() {
   return useQuery({
     queryKey: ['marketing-campaign-stats'],
     queryFn: async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return [];
 
       const { data, error } = await supabase
         .from('marketing_campaign_stats' as any)
         .select('*')
         .order('date', { ascending: false });
 
       if (error) throw error;
       return data as CampaignStat[];
     },
   });
 }