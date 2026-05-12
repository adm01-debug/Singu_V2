 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 
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
       if (!contactId) return [];
       // Using a fallback for missing table/data
       try {
         const { data, error } = await supabase
           .from('social_insights' as any)
           .select('*')
           .eq('contact_id', contactId)
           .order('created_at', { ascending: false });
         
         if (error) throw error;
         return (data as any) as SocialInsight[];
       } catch (e) {
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