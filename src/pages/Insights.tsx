import { useState, useEffect, useCallback, useRef } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { Sparkles, RefreshCw, Heart, Briefcase } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortfolioCompatibilityReport } from '@/components/triggers/PortfolioCompatibilityReport';
import { CompatibilityAlertsList } from '@/components/triggers/CompatibilityAlertsList';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { CarnegieDashboard } from '@/components/carnegie';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { toast } from 'sonner';
import { useAccessibleToast } from '@/hooks/useAccessibleToast';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";
import { InsightsContent } from './insights/InsightsContent';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;
type Company = Tables<'companies'>;

interface AIInsight {
  category: string; title: string; description: string; action_suggestion: string;
  confidence: number; actionable: boolean; contact_id?: string; priority: string;
}

const Insights = () => {
  usePageTitle('Insights');
  const { user, session } = useAuth();
  const accessibleToast = useAccessibleToast();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const { query: searchTerm, setQuery: setSearchTerm, results: fuzzyResults, isSearching, clearSearch } = useFuzzySearch(insights, {
    keys: ['title', 'description', 'action_suggestion', 'category'], threshold: 0.3, minChars: 1,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const [contactsRes, interactionsRes, companiesRes] = await Promise.all([
        supabase.from('contacts').select('id, first_name, last_name, role_title, relationship_score, relationship_stage, sentiment, updated_at').eq('user_id', user.id).limit(50),
        supabase.from('interactions').select('id, type, title, content, sentiment, follow_up_required, created_at, contact_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('companies').select('id, name, industry, financial_health').eq('user_id', user.id).limit(20),
      ]);
      if (controller.signal.aborted) return;
      setContacts((contactsRes.data || []) as Contact[]);
      if ((contactsRes.data?.length || 0) > 0 || (interactionsRes.data?.length || 0) > 0) {
        await generateInsights((contactsRes.data || []) as never, (interactionsRes.data || []) as never, companiesRes.data || [], controller.signal);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      logger.error('Error fetching data:', error);
    }
    finally { if (!controller.signal.aborted) setLoading(false); }
  // session?.access_token can refresh hourly; including it ensures fetchData always
  // calls generateInsights with the current token, not a stale one from the initial render.
  }, [user, session?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); return () => { abortRef.current?.abort(); }; }, [fetchData]);

  const generateInsights = async (contactsData: Contact[], interactionsData: Interaction[], companiesData: Company[], signal?: AbortSignal) => {
    if (!session?.access_token) { toast.error('Você precisa estar logado para gerar insights'); return; }
    setGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        signal,
        body: JSON.stringify({
          contacts: contactsData.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}`, role: c.role_title, relationship_score: c.relationship_score, relationship_stage: c.relationship_stage, sentiment: c.sentiment, last_interaction: c.updated_at })),
          interactions: interactionsData.map(i => ({ id: i.id, type: i.type, title: i.title, content: i.content?.slice(0, 200), sentiment: i.sentiment, follow_up_required: i.follow_up_required, created_at: i.created_at, contact_id: i.contact_id })),
          companies: companiesData.map(c => ({ id: c.id, name: c.name, industry: c.industry, financial_health: c.financial_health })),
        }),
      });
      if (signal?.aborted) return;
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Erro ao gerar insights'); }
      const data = await response.json();
      setInsights(data.insights || []);
      if (data.insights?.length > 0) accessibleToast.success(`${data.insights.length} insights gerados com IA!`);
      else accessibleToast.info('Adicione mais dados para gerar insights personalizados');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      logger.error('Error generating insights:', error); accessibleToast.error(error instanceof Error ? error.message : 'Erro ao gerar insights');
    }
    finally { if (!signal?.aborted) setGenerating(false); }
  };

  const handleRefreshInsights = async () => {
    try {
      if (!user) return;
      const [contactsRes, interactionsRes, companiesRes] = await Promise.all([
        supabase.from('contacts').select('id, first_name, last_name, role_title, relationship_score, relationship_stage, sentiment, updated_at').eq('user_id', user.id).limit(50),
        supabase.from('interactions').select('id, type, title, content, sentiment, follow_up_required, created_at, contact_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('companies').select('id, name, industry, financial_health').eq('user_id', user.id).limit(20),
      ]);
      await generateInsights((contactsRes.data || []) as Contact[], (interactionsRes.data || []) as Interaction[], (companiesRes.data || []) as Company[]);
    } catch (error) { logger.error('Error refreshing insights:', error); toast.error('Erro ao atualizar insights. Tente novamente.'); }
  };

  return (
    <AppLayout>
      <SEOHead title="Insights" description="Descobertas e recomendações de inteligência relacional" />
      <Header title="Insights com IA" subtitle="Análise inteligente dos seus relacionamentos e interações" hideBack />
      <div className="p-6 space-y-6">
        <SmartBreadcrumbs />
        <Tabs defaultValue="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="insights" className="gap-2"><Sparkles className="w-4 h-4" />Insights IA</TabsTrigger>
              <TabsTrigger value="compatibility" className="gap-2"><Briefcase className="w-4 h-4" />Compatibilidade</TabsTrigger>
              <TabsTrigger value="carnegie" className="gap-2"><Heart className="w-4 h-4" />Carnegie</TabsTrigger>
            </TabsList>
            <Button onClick={handleRefreshInsights} disabled={generating} className="gap-2">
              <RefreshCw className={cn("w-4 h-4", generating && "animate-spin")} />
              {generating ? 'Gerando...' : 'Gerar Novos Insights'}
            </Button>
          </div>
          <TabsContent value="compatibility" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><PortfolioCompatibilityReport /></div>
              <div><CompatibilityAlertsList maxItems={10} /></div>
            </div>
          </TabsContent>
          <TabsContent value="carnegie" className="mt-0"><CarnegieDashboard /></TabsContent>
          <TabsContent value="insights" className="mt-0 space-y-6">
            <InsightsContent
              insights={insights} contacts={contacts} loading={loading} generating={generating}
              searchTerm={searchTerm} setSearchTerm={setSearchTerm} isSearching={isSearching}
              clearSearch={clearSearch} fuzzyResults={fuzzyResults}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Insights;
