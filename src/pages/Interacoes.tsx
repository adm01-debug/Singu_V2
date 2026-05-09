import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { toast } from 'sonner';
import { base64UrlToBundle, type PresetBundle } from '@/lib/searchPresetTransport';
import { useSearchPresets } from '@/hooks/useSearchPresets';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { MessageSquare, Phone, Mail, Users, Video, FileText, AlertCircle, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InteractionForm } from '@/components/forms/InteractionForm';
import { useInteractions, type Interaction } from '@/hooks/useInteractions';
import { useContacts } from '@/hooks/useContacts';
import { useMiniCelebration } from '@/components/celebrations/MiniCelebration';
import { useNLPAutoAnalysis } from '@/hooks/useNLPAutoAnalysis';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import type { FilterConfig, SortOption } from '@/components/filters/AdvancedFilters';
import { InteracoesContent } from './interacoes/InteracoesContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedTimelineView } from '@/components/interactions/UnifiedTimelineView';
import { useSearchParams } from 'react-router-dom';
import { List, Activity, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const InsightsPanel = lazy(() => import('@/components/interactions/insights/InsightsPanel').then(m => ({ default: m.InsightsPanel })));

const filterConfigs: FilterConfig[] = [
  { key: 'type', label: 'Tipo', multiple: true, options: [{ value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }, { value: 'call', label: 'Ligação', icon: Phone }, { value: 'email', label: 'Email', icon: Mail }, { value: 'meeting', label: 'Reunião', icon: Users }, { value: 'video_call', label: 'Videochamada', icon: Video }, { value: 'note', label: 'Nota', icon: FileText }] },
  { key: 'sentiment', label: 'Sentimento', multiple: false, options: [{ value: 'positive', label: 'Positivo' }, { value: 'neutral', label: 'Neutro' }, { value: 'negative', label: 'Negativo' }] },
  { key: 'follow_up_required', label: 'Follow-up', multiple: false, options: [{ value: 'true', label: 'Pendente', icon: AlertCircle }, { value: 'false', label: 'Concluído' }] },
  { key: 'initiated_by', label: 'Iniciado por', multiple: false, options: [{ value: 'us', label: 'Nós' }, { value: 'them', label: 'Contato' }] },
];

const sortOptions: SortOption[] = [
  { value: 'created_at', label: 'Data' },
  { value: 'title', label: 'Título' },
  { value: 'type', label: 'Tipo' },
  { value: 'duration', label: 'Duração' },
];

const Interacoes = () => {
  usePageTitle('Interações');
  const { interactions, loading, hasMore, loadMore, isFetchingNextPage, totalCount, createInteraction, updateInteraction, deleteInteraction } = useInteractions();
  const { contacts } = useContacts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [deletingInteraction, setDeletingInteraction] = useState<Interaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const celebration = useMiniCelebration();
  const { triggerAnalysis } = useNLPAutoAnalysis();
  const { logActivity } = useActivityLogger();

  const contactMap = useMemo(() => { const map = new Map<string, typeof contacts[0]>(); for (const c of contacts) map.set(c.id, c); return map; }, [contacts]);

  const stats = useMemo(() => {
    const followUpCount = interactions.filter(i => i.follow_up_required).length;
    const thisWeek = interactions.filter(i => { const d = new Date(i.created_at); return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); }).length;
    return { total: interactions.length, followUp: followUpCount, thisWeek };
  }, [interactions]);

  const handleCreate = async (data: Parameters<typeof createInteraction>[0], event?: React.MouseEvent) => {
    setIsSubmitting(true);
    const result = await createInteraction(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false);
      logActivity({ type: 'created', entityType: 'interaction', entityId: result.id || '', entityName: data.title, description: `Tipo: ${data.type}` });
      if (result.id && data.contact_id) triggerAnalysis(data.contact_id, result.id, data.content || null, null, data.type);
      const pos = event || { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
      celebration.trigger(pos, { variant: 'success', message: 'Interação criada!' });
    }
  };

  const handleUpdate = async (data: Parameters<typeof updateInteraction>[1], event?: React.MouseEvent) => {
    if (!editingInteraction) return;
    setIsSubmitting(true);
    const result = await updateInteraction(editingInteraction.id, data);
    setIsSubmitting(false);
    if (result) { setEditingInteraction(null); const pos = event || { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }; celebration.trigger(pos, { variant: 'star', message: 'Atualizado!' }); }
  };

  const handleDelete = async () => { if (!deletingInteraction) return; await deleteInteraction(deletingInteraction.id); setDeletingInteraction(null); };

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'timeline' || tabParam === 'insights' ? tabParam : 'lista';
  const handleTabChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'lista') next.delete('tab'); else next.set('tab', val);
    setSearchParams(next, { replace: true });
  };

  // Auto-import via ?preset=<base64url>
  const { importPresets } = useSearchPresets('interactions');
  const [pendingBundle, setPendingBundle] = useState<PresetBundle | null>(null);

  useEffect(() => {
    const b64 = searchParams.get('preset');
    if (!b64) return;
    const bundle = base64UrlToBundle(b64);
    if (!bundle) {
      toast.error('Link de busca inválido');
      const next = new URLSearchParams(searchParams);
      next.delete('preset');
      setSearchParams(next, { replace: true });
      return;
    }
    setPendingBundle(bundle);
  }, [searchParams, setSearchParams]);

  const clearPresetParam = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('preset');
    setSearchParams(next, { replace: true });
    setPendingBundle(null);
  };

  const confirmImport = () => {
    if (!pendingBundle) return;
    const total = pendingBundle.presets.length;
    const { added, skipped, renamed, renamedDetails } = importPresets(pendingBundle.presets);
    if (added > 0) {
      const descParts: string[] = [];
      if (skipped > 0) {
        descParts.push(
          `${skipped} ignorada${skipped > 1 ? 's' : ''} — limite de 10 atingido`,
        );
      }
      if (renamed > 0) {
        const sample = renamedDetails
          .slice(0, 2)
          .map((r) => `"${r.from}" → "${r.to}"`)
          .join(', ');
        const extra = renamedDetails.length > 2 ? ` +${renamedDetails.length - 2}` : '';
        descParts.push(`${renamed} renomeada${renamed > 1 ? 's' : ''} (${sample}${extra})`);
      }
      toast.success(
        `${added} de ${total} busca${total > 1 ? 's' : ''} importada${added > 1 ? 's' : ''}`,
        descParts.length > 0 ? { description: descParts.join(' · '), duration: 6000 } : undefined,
      );
    } else {
      toast.error('Nenhuma busca importada', {
        description: 'Você já tem 10 buscas salvas. Remova alguma antes de importar.',
        duration: 6000,
      });
    }
    clearPresetParam();
  };

  return (
    <AppLayout>
      <SEOHead title="Interações" description="Histórico completo de comunicações e engajamentos" />
      <Header title="Interações" subtitle={`${interactions.length} interações`} hideBack showAddButton addButtonLabel="Nova Interação" onAddClick={() => setIsFormOpen(true)} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="px-6 pt-4">
        <TabsList>
          <TabsTrigger value="lista" className="gap-2"><List className="w-4 h-4" />Lista</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2"><Activity className="w-4 h-4" />Timeline</TabsTrigger>
          <TabsTrigger value="insights" className="gap-2"><Sparkles className="w-4 h-4" />Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="lista" className="mt-0">
          <InteracoesContent interactions={interactions} loading={loading} hasMore={hasMore} loadMore={loadMore} isFetchingNextPage={isFetchingNextPage} totalCount={totalCount} contactMap={contactMap} stats={stats} onSetIsFormOpen={setIsFormOpen} onSetEditingInteraction={setEditingInteraction} onSetDeletingInteraction={setDeletingInteraction} filterConfigs={filterConfigs} sortOptions={sortOptions} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-0 p-6">
          <UnifiedTimelineView />
        </TabsContent>
        <TabsContent value="insights" className="mt-0 p-6">
          <Suspense fallback={<div className="space-y-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-24" /><Skeleton className="h-56" /></div>}>
            <InsightsPanel />
          </Suspense>
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><InteractionForm contacts={contacts} onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} isSubmitting={isSubmitting} /></DialogContent></Dialog>
      <Dialog open={!!editingInteraction} onOpenChange={(open) => !open && setEditingInteraction(null)}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><InteractionForm interaction={editingInteraction} contacts={contacts} onSubmit={handleUpdate} onCancel={() => setEditingInteraction(null)} isSubmitting={isSubmitting} /></DialogContent></Dialog>
      <AlertDialog open={!!deletingInteraction} onOpenChange={(open) => !open && setDeletingInteraction(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir interação?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir esta interação? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!pendingBundle} onOpenChange={(open) => !open && clearPresetParam()}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Importar busca compartilhada?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {pendingBundle && (
                  <>
                    <p>
                      Este link contém <strong>{pendingBundle.presets.length}</strong> busca
                      {pendingBundle.presets.length > 1 ? 's' : ''} salva
                      {pendingBundle.presets.length > 1 ? 's' : ''}:
                    </p>
                    <ul className="mt-2 space-y-1.5 max-h-56 overflow-y-auto">
                      {pendingBundle.presets.slice(0, 8).map((p, i) => {
                        const f = p.filters || {};
                        const parts: string[] = [];
                        if (f.q?.[0]) parts.push(`"${String(f.q[0]).slice(0, 24)}"`);
                        if (Array.isArray(f.canais) && f.canais.length > 0)
                          parts.push(`${f.canais.length} canal${f.canais.length > 1 ? 'is' : ''}`);
                        if (f.contact?.[0]) parts.push('pessoa');
                        if (f.company?.[0]) parts.push('empresa');
                        if (f.de?.[0] || f.ate?.[0]) parts.push('data');
                        const summary = parts.join(' · ') || 'sem filtros';
                        return (
                          <li key={i} className="text-sm border border-border rounded px-2 py-1.5">
                            <div className="font-medium text-foreground truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{summary}</div>
                          </li>
                        );
                      })}
                      {pendingBundle.presets.length > 8 && (
                        <li className="text-xs text-muted-foreground">
                          …e mais {pendingBundle.presets.length - 8}
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={clearPresetParam}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Importar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {celebration.MiniCelebrationComponent}
    </AppLayout>
  );
};

export default Interacoes;
