import { useState, useEffect, useCallback, useMemo } from 'react';
import { CustomFieldsDisplay } from '@/components/custom-fields/CustomFieldsDisplay';
import { DocumentsPanel } from '@/components/documents/DocumentsPanel';
import { useParams, Link } from 'react-router-dom';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHeader } from '@/components/navigation/PageHeader';
import { queryExternalData, updateExternalData } from '@/lib/externalData';
import { toTitleCase } from '@/lib/formatters';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLuxIntelligence } from '@/hooks/useLuxIntelligence';
import { useCompanyPhones, useCompanyEmails, useCompanyAddresses, useCompanySocialMedia, useCompanyCnaes, useCompanyRfmScores, useCompanyStakeholders } from '@/hooks/useCompanyRelatedData';
import { useCompanySummaryView } from '@/hooks/useCompanyViews';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, Edit, Plus, MessageSquare,
  Network, BarChart3, Sparkles, Database, ShoppingCart,
  AlertTriangle, RotateCcw, Target, Zap, Globe, MapPin, 
  Phone, Mail, Calendar, ExternalLink, ChevronRight, Activity, 
  TrendingUp, ShieldCheck, UserCheck, Star
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EntityDetailPageSkeleton } from '@/components/skeletons/PageSkeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { ContactForm } from '@/components/forms/ContactForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyHealthScore } from '@/components/ui/company-health-score';
import { StakeholderMap } from '@/components/stakeholders/StakeholderMap';
import { LuxButton } from '@/components/lux/LuxButton';
import { LuxIntelligencePanel } from '@/components/lux/LuxIntelligencePanel';
import { CompanyProfileCard } from '@/components/company-detail/CompanyProfileCard';
import { CompanyInsightsTab } from '@/components/company-detail/CompanyInsightsTab';
import { CompanyInteractionsTab } from '@/components/company-detail/CompanyInteractionsTab';
import { useInteractions } from '@/hooks/useInteractions';
import { CompanyDataTab } from '@/components/company-detail/CompanyDataTab';
import { CompanyCommercialTab } from '@/components/company-detail/CompanyCommercialTab';
import { CompanyEnrichedCard } from '@/components/company-detail/CompanyEnrichedCard';
import { CompanyDuplicatesPanel } from '@/components/company-detail/CompanyDuplicatesPanel';
import { CompanyErpProposalsWidget } from '@/components/erp/CompanyErpProposalsWidget';
import { ContactsTabContent } from './empresa-detalhe/ContactsTabContent';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";
import { useToast } from '@/hooks/use-toast';

type Company = Tables<'companies'>;
type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;
type HealthStatus = 'growing' | 'stable' | 'cutting' | 'unknown';

const EmpresaDetalhe = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackView } = useRecentlyViewed();
  const { records: luxRecords, latestRecord: luxRecord, loading: luxLoading, triggering: luxTriggering, triggerLux } = useLuxIntelligence('company', id);
  const { interactions: hookInteractions, loading: interactionsLoading } = useInteractions(undefined, id);
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const phonesHook = useCompanyPhones(id);
  const emailsHook = useCompanyEmails(id);
  const addressesHook = useCompanyAddresses(id);
  const socialMediaHook = useCompanySocialMedia(id);
  const cnaesHook = useCompanyCnaes(id);
  const rfmHook = useCompanyRfmScores(id);
  const stakeholdersHook = useCompanyStakeholders(id);
  const { data: companySummary } = useCompanySummaryView(id);

  const isDeleted = !!(company as Record<string, unknown>)?.deleted_at;
  const leadScore = companySummary?.lead_score ?? (company as Record<string, unknown>)?.lead_score as number | null;
  const leadStatus = companySummary?.lead_status ?? (company as Record<string, unknown>)?.lead_status as string | null;

  const handleRestore = async () => {
    if (!id) return;
    try {
      await updateExternalData('companies', id, { deleted_at: null, deleted_by: null });
      toast({ title: 'Empresa restaurada', description: 'A empresa foi reativada com sucesso.' });
      fetchCompanyData();
    } catch (e) { 
      const msg = e instanceof Error ? e.message : 'Erro ao restaurar';
      toast({ title: 'Erro ao restaurar', description: msg, variant: 'destructive' }); 
    }
  };

  const fetchCompanyData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: companyResult, error: companyError } = await queryExternalData<Record<string, unknown>>({ table: 'companies', filters: [{ type: 'eq', column: 'id', value: id }] });
      if (companyError) throw companyError;
      const raw = Array.isArray(companyResult) ? (companyResult.at(0) ?? null) : null;
      const companyData = raw ? { ...raw, name: (raw.nome_crm || raw.nome_fantasia || raw.razao_social || 'Sem nome') as string, industry: (raw.ramo_atividade || null) as string | null, tags: (raw.tags_array || []) as string[], challenges: (raw.challenges || []) as string[], competitors: (raw.competitors || []) as string[] } as Company : null;
      setCompany(companyData);

      if (companyData && id) {
        trackView({ id, type: 'company', name: companyData.name, subtitle: companyData.industry || undefined, avatarUrl: companyData.logo_url || undefined });
      }

      if (companyData) {
        const { data: contactsResult, error: contactsError } = await queryExternalData<Contact>({ table: 'contacts', filters: [{ type: 'eq', column: 'company_id', value: id }], order: { column: 'relationship_score', ascending: false } });
        if (contactsError) throw contactsError;
        const normalizedContacts = (contactsResult || []).map((c: Record<string, unknown>) => ({ ...c, first_name: c.first_name || c.nome || 'Sem', last_name: c.last_name || c.sobrenome || 'nome', tags: c.tags || [], hobbies: c.hobbies || [], interests: c.interests || [] })) as Contact[];
        setContacts(normalizedContacts);

        // As interações agora são gerenciadas pelo hook useInteractions(undefined, id)
        // Isso remove o fetch manual e garante resiliência e cache via React Query.
      }
    } catch (error) { logger.error('Error fetching company data:', error); } finally { setLoading(false); }
  }, [id, user, trackView]);

  useEffect(() => { if (id && user) fetchCompanyData(); }, [id, user, fetchCompanyData]);

  const stats = useMemo(() => {
    const avgScore = contacts.length > 0 ? Math.round(contacts.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / contacts.length) : 0;
    const total = hookInteractions.length;
    const positive = hookInteractions.filter(i => i.sentiment === 'positive').length;
    const pending = hookInteractions.filter(i => i.follow_up_required && !i.follow_up_date).length;
    const lastDate = total > 0 ? new Date(hookInteractions[0]?.created_at || Date.now()) : null;
    const daysSince = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
    return { avgScore, total, positive, positiveRatio: total > 0 ? positive / total : 0, pending, daysSince };
  }, [contacts, hookInteractions]);

  const handleEditSubmit = async (data: Record<string, unknown>) => {
    if (!id) return;
    setEditSubmitting(true);
    try {
      const { name, industry, tags, notes, phone, email, address, city, state, instagram, linkedin, facebook, youtube, twitter, tiktok, ...cleanData } = data as Record<string, unknown>;
      const { error } = await updateExternalData('companies', id, cleanData);
      if (error) throw error;
      toast({ title: 'Empresa atualizada', description: 'As alterações foram salvas.' });
      setIsEditOpen(false);
      fetchCompanyData();
    } catch (error) {
      logger.error('Error updating company:', error);
      toast({ title: 'Erro ao atualizar', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
    } finally { setEditSubmitting(false); }
  };

  if (loading) return (<AppLayout><EntityDetailPageSkeleton /></AppLayout>);
  if (!company) return (<AppLayout><div className="p-6 text-center"><Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h2 className="text-xl font-semibold mb-2">Empresa não encontrada</h2><p className="text-muted-foreground mb-4">A empresa que você procura não existe ou foi removida.</p><Link to="/empresas"><Button>Voltar para Empresas</Button></Link></div></AppLayout>);

  const healthStatus = (company.financial_health as HealthStatus) || 'unknown';

  return (
    <>
    <AppLayout>
      <SEOHead title={toTitleCase(company.name)} description={`Detalhes da empresa ${toTitleCase(company.name)}`} />
      <div className="min-h-screen pt-2 md:pt-4">
        <div className="px-4 md:px-6 pt-3 md:pt-4">
          <PageHeader backTo="/empresas" backLabel="Empresas" title={toTitleCase(company.name)} />
        </div>

        {isDeleted && (
          <div className="mx-4 md:mx-6 mt-2 mb-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div><p className="text-sm font-medium">Empresa excluída</p><p className="text-xs opacity-80">Esta empresa foi removida e não aparece na listagem.</p></div>
            </div>
            <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={handleRestore}><RotateCcw className="w-4 h-4 mr-1.5" />Restaurar</Button>
          </div>
        )}

        <div className="h-56 bg-gradient-primary relative z-0 overflow-hidden rounded-2xl mx-4 md:mx-6 mt-2">
          {(leadScore || leadStatus) && (
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Target className="w-4 h-4 text-primary-foreground/80" />
                <span className="text-xs font-medium text-primary-foreground">Lead{leadScore ? ` ${leadScore}/100` : ''}{leadStatus ? ` · ${leadStatus}` : ''}</span>
              </div>
            </div>
          )}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <LuxButton onClick={() => triggerLux({ name: company.name, cnpj: company.cnpj, website: company.website, industry: company.industry })} loading={luxTriggering} processing={luxRecord?.status === 'processing'} variant="header" />
            <Button className="bg-primary-foreground/10 backdrop-blur hover:bg-primary-foreground/20 text-primary-foreground border-0" onClick={() => setIsAddContactOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Contato</Button>
            <Button className="bg-primary-foreground/10 backdrop-blur hover:bg-primary-foreground/20 text-primary-foreground border-0" onClick={() => setIsEditOpen(true)}><Edit className="w-4 h-4 mr-2" />Editar</Button>
          </div>
        </div>

        <div className="relative z-10 px-4 md:px-6 -mt-12 md:-mt-16 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CompanyProfileCard company={company} contactCount={contacts.length} totalInteractions={stats.total} avgRelationshipScore={stats.avgScore} phones={phonesHook.data} emails={emailsHook.data} addresses={addressesHook.data} socialMedia={socialMediaHook.data} />

            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                <CompanyHealthScore financialHealth={healthStatus} contactCount={contacts.length} avgRelationshipScore={stats.avgScore} totalInteractions={stats.total} positiveInteractionsRatio={stats.positiveRatio} pendingFollowUps={stats.pending} daysSinceLastInteraction={stats.daysSince} />
              </motion.div>

              <Tabs defaultValue="contacts" className="w-full">
                <TabsList className="flex w-full overflow-x-auto gap-1">
                  <TabsTrigger value="contacts" className="flex items-center gap-2"><Users className="w-4 h-4" /><span className="hidden sm:inline">Contatos ({contacts.length})</span><span className="sm:hidden">{contacts.length}</span></TabsTrigger>
                  <TabsTrigger value="data" className="flex items-center gap-2"><Database className="w-4 h-4" /><span className="hidden sm:inline">Dados</span></TabsTrigger>
                  <TabsTrigger value="stakeholders" className="flex items-center gap-2"><Network className="w-4 h-4" /><span className="hidden sm:inline">Stakeholders</span></TabsTrigger>
                  <TabsTrigger value="interactions" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">Histórico ({stats.total})</span><span className="sm:hidden">{stats.total}</span></TabsTrigger>
                  <TabsTrigger value="commercial" className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /><span className="hidden sm:inline">Comercial</span></TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Insights</span></TabsTrigger>
                  <TabsTrigger value="lux" className="flex items-center gap-2 text-accent-foreground"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline">Lux</span></TabsTrigger>
                </TabsList>

                <TabsContent value="contacts" className="mt-4"><DashboardErrorBoundary sectionName="Contatos"><ContactsTabContent contacts={contacts} /></DashboardErrorBoundary></TabsContent>
                <TabsContent value="data" className="mt-4 space-y-4"><DashboardErrorBoundary sectionName="Dados"><CompanyDataTab cnaes={cnaesHook.data} rfmScores={rfmHook.data} stakeholders={stakeholdersHook.data} loading={cnaesHook.isLoading || rfmHook.isLoading || stakeholdersHook.isLoading} /></DashboardErrorBoundary><DashboardErrorBoundary sectionName="Campos Personalizados"><CustomFieldsDisplay entityType="company" entityId={id!} /></DashboardErrorBoundary><DashboardErrorBoundary sectionName="Documentos"><DocumentsPanel entityType="company" entityId={id!} /></DashboardErrorBoundary><DashboardErrorBoundary sectionName="Dados Enriquecidos"><CompanyEnrichedCard companyId={id!} /></DashboardErrorBoundary><DashboardErrorBoundary sectionName="Duplicatas"><CompanyDuplicatesPanel /></DashboardErrorBoundary></TabsContent>
                <TabsContent value="stakeholders" className="mt-4"><DashboardErrorBoundary sectionName="Stakeholders"><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}><StakeholderMap contacts={contacts} interactions={hookInteractions} companyId={id} /></motion.div></DashboardErrorBoundary></TabsContent>
                <TabsContent value="interactions" className="mt-4"><DashboardErrorBoundary sectionName="Interações"><CompanyInteractionsTab interactions={hookInteractions} contacts={contacts} /></DashboardErrorBoundary></TabsContent>
                <TabsContent value="commercial" className="mt-4 space-y-4"><DashboardErrorBoundary sectionName="Comercial"><CompanyCommercialTab companyId={id!} /></DashboardErrorBoundary><DashboardErrorBoundary sectionName="Propostas ERP"><CompanyErpProposalsWidget companyId={id!} /></DashboardErrorBoundary></TabsContent>
                <TabsContent value="insights" className="mt-4"><DashboardErrorBoundary sectionName="Insights"><CompanyInsightsTab companyId={company.id} contacts={contacts} avgRelationshipScore={stats.avgScore} totalInteractions={stats.total} positiveInteractions={stats.positive} pendingFollowUps={stats.pending} /></DashboardErrorBoundary></TabsContent>
                <TabsContent value="lux" className="mt-4"><DashboardErrorBoundary sectionName="Lux Intelligence"><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}><Card><CardContent className="pt-6"><LuxIntelligencePanel record={luxRecord} records={luxRecords} entityType="company" loading={luxLoading} onTrigger={() => triggerLux({ name: company.name, cnpj: company.cnpj, website: company.website, industry: company.industry })} triggering={luxTriggering} /></CardContent></Card></motion.div></DashboardErrorBoundary></TabsContent>
              </Tabs>

              {company.notes && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                  <Card><CardContent className="pt-6"><div className="flex items-center gap-2 mb-3"><Edit className="w-4 h-4 text-muted-foreground" /><h3 className="text-sm font-semibold">Notas</h3></div><p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.notes}</p></CardContent></Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>

    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <CompanyForm company={company} onSubmit={handleEditSubmit} onCancel={() => setIsEditOpen(false)} isSubmitting={editSubmitting} />
      </DialogContent>
    </Dialog>

    <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ContactForm
          companies={company ? [company] : []}
          defaultCompanyId={id}
          onSubmit={async (data) => {
            if (!user) return;
            try {
              const { error } = await supabase.from('contacts').insert({ ...data, user_id: user.id, company_id: id } as unknown as import('@/integrations/supabase/types').Database['public']['Tables']['contacts']['Insert']);
              if (error) throw error;
              setIsAddContactOpen(false);
              fetchCompanyData();
            } catch (error) { logger.error('Error adding contact:', error); }
          }}
          onCancel={() => setIsAddContactOpen(false)}
          isSubmitting={false}
        />
      </DialogContent>
    </Dialog>
    </>
  );
};

export default EmpresaDetalhe;
