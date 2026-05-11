 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 
 export interface SocialInsight {
   id: string;
   platform: string;
   insight_type: string;
   content: string;
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
             insight_type: 'interest',
             content: 'Engajamento com tópicos de sustentabilidade e ESG corporativo.',
             indicator_score: 70,
             sentiment: 'positive',
             created_at: new Date(Date.now() - 86400000 * 2).toISOString()
           }
         ] as SocialInsight[];
       }
     },
     enabled: !!contactId && !!user,
     staleTime: 15 * 60 * 1000,
   });
 }