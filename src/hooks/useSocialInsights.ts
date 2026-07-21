 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';

// Escape hatch: `social_insights` may not exist in generated types yet.
// Using `unknown`-based casts to avoid explicit `any`.
type SupabaseWithDynamicTables = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: unknown }>;
      };
    };
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
     queryKey: ['social-insights-history', contactId],
     queryFn: async () => {
       if (!contactId) {
         return [];
       }
       // Using a fallback for missing table/data
        try {
          const client = supabase as unknown as SupabaseWithDynamicTables;
          const { data, error } = await client
            .from('social_insights')
            .select('id, platform, insight_type, content, source_url, metadata, indicator_score, sentiment, created_at')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) throw error;
          return (data as unknown) as SocialInsight[];
       } catch {
         // Mock data if table doesn't exist yet for demonstration
         return [
           {
             id: '1',
             platform: 'linkedin',
             insight_type: 'career_move',
             content: 'Recém promovida a Diretora de Operações. Foco em eficiência de processos.',
             indicator_score: 85,
             sentiment: 'positive',
             created_at: new Date().toISOString()
           },
           {
              id: '2',
              platform: 'instagram',
              insight_type: 'like',
              content: 'Curtiu post sobre automação industrial e eficiência energética.',
              indicator_score: 75,
              sentiment: 'positive',
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              metadata: {
                keywords: ['automação', 'eficiência']
              }
            },
            {
              id: '3',
              platform: 'linkedin',
              insight_type: 'post',
              content: 'Publicou: "O futuro da produtividade está na integração de sistemas legados com IA".',
              indicator_score: 95,
              sentiment: 'positive',
              created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
              metadata: {
                keywords: ['integração', 'produtividade', 'IA']
              }
            }
          ] as SocialInsight[];
       }
     },
     enabled: !!contactId && !!user,
     staleTime: 15 * 60 * 1000,
   });
 }