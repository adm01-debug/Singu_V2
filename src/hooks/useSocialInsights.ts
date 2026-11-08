 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';

// Escape hatch: `social_insights` may not exist in generated types yet.
// Using `unknown`-based casts to avoid explicit `any`.
type SocialInsightsQuery = {
  eq: (col: string, val: string) => SocialInsightsQuery;
  order: (col: string, opts: { ascending: boolean }) => SocialInsightsQuery;
  limit: (n: number) => Promise<{ data: SocialInsight[] | null; error: unknown }>;
};
type SupabaseWithDynamicTables = {
  from: (table: string) => {
    select: (cols: string) => SocialInsightsQuery;
  };
};
 
 export interface SocialInsight {
   id: string;
 platform: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'youtube';
 insight_type: 'career_move' | 'interest' | 'post' | 'like' | 'comment';
 content: string;
 source_url?: string;
 metadata?: {
   post_id?: string;
   keywords?: string[];
   engagement_type?: string;
 };
   indicator_score: number;
   sentiment: 'positive' | 'neutral' | 'negative';
   created_at: string;
 }
 
 export function useSocialInsights(contactId: string | undefined) {
   const { user } = useAuth();
 
   return useQuery({
     queryKey: ['social-insights-history', contactId, user?.id],
     queryFn: async () => {
       if (!contactId || !user?.id) {
         return [];
       }
       const client = supabase as unknown as SupabaseWithDynamicTables;
       const { data, error } = await client
         .from('social_insights')
         .select('id, platform, insight_type, content, source_url, metadata, indicator_score, sentiment, created_at')
         .eq('contact_id', contactId)
         .eq('user_id', user.id)
         .order('created_at', { ascending: false })
         .limit(100);

       if (error) throw error;
       return data ?? [];
     },
     enabled: !!contactId && !!user?.id,
     retry: false,
     staleTime: 15 * 60 * 1000,
     refetchOnWindowFocus: false,
   });
 }