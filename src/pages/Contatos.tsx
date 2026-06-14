import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSearchParams } from 'react-router-dom';
import { sortArray } from '@/lib/sorting-utils';
import { Crown, Briefcase, ShoppingCart, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingQuickActions } from '@/components/quick-actions/FloatingQuickActions';
import { Header } from '@/components/layout/Header';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ContactForm } from '@/components/forms/ContactForm';
import { KeyboardShortcutsCheatsheet } from '@/components/keyboard/KeyboardShortcutsCheatsheet';
import { useAccessibleToast } from '@/hooks/useAccessibleToast';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useMiniCelebration } from '@/components/celebrations/MiniCelebration';
import { useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import { hapticHeavy, hapticSuccess } from '@/lib/haptics';
import { useSuccessCelebration } from '@/hooks/useSuccessCelebration';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import type { ViewMode, GridColumns } from '@/components/ui/view-mode-switcher';
import { ContatosContent } from './contatos/ContatosContent';
import { SavedViewsBar } from '@/components/views/SavedViewsBar';
import { useSavedViews } from '@/hooks/useSavedViews';
import { useActionToast } from '@/hooks/useActionToast';
import { useRestoreEntity } from '@/hooks/useRestoreEntity';

interface ContatosViewState {
  searchTerm: string;
  viewMode: ViewMode;
  gridColumns: GridColumns;
  activeFilters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  multiSort: Array<{ column: string, order: 'asc' | 'desc' }>;
}

const filterConfigs = [
  { key: 'role', label: 'Papel', multiple: true, options: [{ value: 'owner', label: 'Proprietário', icon: Crown }, { value: 'manager', label: 'Gerente', icon: Briefcase }, { value: 'buyer', label: 'Comprador', icon: ShoppingCart }, { value: 'contact', label: 'Contato', icon: User }] },
  { key: 'sentiment', label: 'Sentimento', multiple: false, options: [{ value: 'positive', label: 'Positivo' }, { value: 'neutral', label: 'Neutro' }, { value: 'negative', label: 'Negativo' }] },
  { key: 'relationship_stage', label: 'Estágio', multiple: true, options: [{ value: 'lead', label: 'Lead' }, { value: 'prospect', label: 'Prospect' }, { value: 'negotiation', label: 'Negociação' }, { value: 'client', label: 'Cliente' }, { value: 'partner', label: 'Parceiro' }, { value: 'churned', label: 'Inativo' }, { value: 'unknown', label: 'Desconhecido' }] },
      { key: 'vak_dominant', label: 'VAK Dominante', multiple: true, options: [
      { value: 'V', label: 'Visual' },
      { value: 'A', label: 'Auditivo' },
      { value: 'K', label: 'Cinestésico' },
      { value: 'D', label: 'Auditivo Digital' },
      { value: 'visual', label: 'Visual (Alt)' },
      { value: 'auditivo', label: 'Auditivo (Alt)' },
      { value: 'cinestesico', label: 'Cinestésico (Alt)' }
    ] },
    { key: 'motivation_direction', label: 'Motivação', multiple: true, options: [
      { value: 'toward', label: 'Em Direção A (Ganhos)' },
      { value: 'away_from', label: 'Afastar-se De (Riscos)' },
      { value: 'balanced', label: 'Equilibrado' }
    ] },
    { key: 'working_style', label: 'Estilo de Trabalho', multiple: true, options: [
      { value: 'options', label: 'Opções (Criativo)' },
      { value: 'procedures', label: 'Procedimentos (Metódico)' },
      { value: 'balanced', label: 'Equilibrado' }
    ] },
    { key: 'reference_frame', label: 'Referência', multiple: true, options: [
      { value: 'internal', label: 'Interna (Decide Só)' },
      { value: 'external', label: 'Externa (Busca Feedback)' },
      { value: 'balanced', label: 'Equilibrado' }
    ] },
    { key: 'most_frequent_objection', label: 'Objeção Comum', multiple: true, options: [
      { value: 'price', label: 'Preço' },
      { value: 'timing', label: 'Momento' },
      { value: 'trust', label: 'Confiança' },
      { value: 'need', label: 'Necessidade' },
      { value: 'authority', label: 'Autoridade' },
      { value: 'competition', label: 'Concorrência' }
    ] },
    { key: 'hobbies', label: 'Hobbies', multiple: true, options: [] },
   { key: 'interests', label: 'Interesses', multiple: true, options: [] },
];

const sortOptions = [
  { value: 'first_name', label: 'Nome' },
  { value: 'relationship_score', label: 'Score de Relacionamento' },
  { value: 'created_at', label: 'Data de Criação' },
  { value: 'updated_at', label: 'Última Atualização' },
];

const Contatos = () => {
  usePageTitle('Contatos');
  const [searchParams, setSearchParams] = useSearchParams();
  const { contacts, loading, createContact, updateContact, deleteContact, fetchContacts, hasMore, loadMore } = useContacts();

  const dynamicFilterConfigs = useMemo(() => {
    const configs = [...filterConfigs];
    
    // Extract unique hobbies and interests from all contacts to populate filters
    const allHobbies = new Set<string>();
    const allInterests = new Set<string>();
    
    contacts.forEach(c => {
      if (Array.isArray(c.hobbies)) c.hobbies.forEach(h => allHobbies.add(h));
      if (Array.isArray(c.interests)) c.interests.forEach(i => allInterests.add(i));
    });

    const hobbyFilter = configs.find(f => f.key === 'hobbies');
    if (hobbyFilter) {
      hobbyFilter.options = Array.from(allHobbies).sort().map(h => ({ value: h, label: h }));
    }

    const interestFilter = configs.find(f => f.key === 'interests');
    if (interestFilter) {
      interestFilter.options = Array.from(allInterests).sort().map(i => ({ value: i, label: i }));
    }

    return configs;
  }, [contacts]);

  // Defer secondary data (companies, interactions) until contacts are loaded — reduces initial concurrent requests
  const [secondaryReady, setSecondaryReady] = useState(false);
  useEffect(() => {
    if (!loading && contacts.length >= 0) {
      const t = setTimeout(() => setSecondaryReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [loading, contacts.length]);

  const { companies } = useCompanies({ enabled: secondaryReady });
  const { interactions } = useInteractions(undefined, undefined, { enabled: secondaryReady });

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<ViewMode>(() => (searchParams.get('view') as ViewMode) || 'grid');
  const [gridColumns, setGridColumns] = useState<GridColumns>(() => { const c = searchParams.get('cols'); return c ? (Number(c) as GridColumns) : 3; });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const accessibleToast = useAccessibleToast();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const celebration = useMiniCelebration();
  const { celebrate } = useSuccessCelebration();
  const { logActivity } = useActivityLogger();
  const { destructive } = useActionToast();
  const { restore } = useRestoreEntity();

  const handleRefresh = useCallback(async () => { await fetchContacts(); }, [fetchContacts]);

  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(() => { try { const f = searchParams.get('filters'); return f ? JSON.parse(decodeURIComponent(f)) : {}; } catch { return {}; } });
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => (searchParams.get('order') as 'asc' | 'desc') || 'desc');
  const [multiSort, setMultiSort] = useState<Array<{ column: string, order: 'asc' | 'desc' }>>(() => {
    try {
      const ms = searchParams.get('msort');
      return ms ? JSON.parse(decodeURIComponent(ms)) : [{ column: sortBy, order: sortOrder }];
    } catch {
      return [{ column: sortBy, order: sortOrder }];
    }
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (Object.keys(activeFilters).length > 0) params.set('filters', encodeURIComponent(JSON.stringify(activeFilters)));
    if (multiSort.length > 0) {
      params.set('msort', encodeURIComponent(JSON.stringify(multiSort)));
    } else {
      if (sortBy !== 'updated_at') params.set('sort', sortBy);
      if (sortOrder !== 'desc') params.set('order', sortOrder);
    }
    if (gridColumns !== 3) params.set('cols', String(gridColumns));
    setSearchParams(params, { replace: true });
  }, [searchTerm, viewMode, activeFilters, sortBy, sortOrder, gridColumns, multiSort, setSearchParams]);

  const { results: fuzzyResults, setQuery: setFuzzyQuery } = useFuzzySearch(contacts, { keys: ['first_name', 'last_name', 'email', 'role_title', 'hobbies', 'interests'], threshold: 0.4 });
  const handleSearchChange = useCallback((value: string) => { setSearchTerm(value); setFuzzyQuery(value); }, [setFuzzyQuery]);

  const filteredAndSortedContacts = useMemo(() => {
    let result = searchTerm ? fuzzyResults : contacts;
    result = result.filter(contact => { 
      for (const [key, values] of Object.entries(activeFilters)) { 
        if (values.length === 0) continue; 
        
        const contactValue = contact[key as keyof Contact]; 
        
        if (key === 'hobbies' || key === 'interests' || key === 'tags') {
          const arrayVal = Array.isArray(contactValue) ? contactValue : [];
          if (!values.some(v => arrayVal.includes(v))) return false;
          continue;
        }

        if (!contactValue || !values.includes(String(contactValue))) return false; 
      } 
      return true; 
    });
    return sortArray(result, multiSort as any, undefined, { dateFields: ['created_at', 'updated_at', 'birthday'], numericFields: ['relationship_score'] });
  }, [contacts, fuzzyResults, searchTerm, activeFilters, multiSort]);

  useKeyboardShortcutsEnhanced();

  const companyNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of companies) { map.set(c.id, c.name); }
    return map;
  }, [companies]);
  const lastInteractionMap = useMemo(() => { const map = new Map<string, string>(); for (const i of interactions) { const existing = map.get(i.contact_id); if (!existing || i.created_at > existing) map.set(i.contact_id, i.created_at); } return map; }, [interactions]);
  const getCompanyName = useCallback((companyId: string | null) => companyId ? companyNameMap.get(companyId) || null : null, [companyNameMap]);
  const getLastInteractionDate = useCallback((contactId: string): string | null => lastInteractionMap.get(contactId) || null, [lastInteractionMap]);

  const handleCreate = async (data: Parameters<typeof createContact>[0], event?: React.MouseEvent) => {
    setIsSubmitting(true);
    const result = await createContact(data);
    setIsSubmitting(false);
    if (result) {
      setIsFormOpen(false); hapticSuccess();
      logActivity({ type: 'created', entityType: 'contact', entityId: result.id || '', entityName: `${data.first_name} ${data.last_name}`.trim() });
      if (contacts.length === 0) celebrate('confetti');
      const pos = event ? event : { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
      celebration.trigger(pos, { variant: 'success', message: 'Contato criado!' });
    }
  };

  const handleUpdate = async (data: Parameters<typeof updateContact>[1], event?: React.MouseEvent) => {
    if (!editingContact) return;
    setIsSubmitting(true);
    const result = await updateContact(editingContact.id, data, editingContact.version);
    setIsSubmitting(false);
    if (result) {
      setEditingContact(null);
      const pos = event ? event : { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
      celebration.trigger(pos, { variant: 'star', message: 'Atualizado!' });
    }
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    const ct = deletingContact; setDeletingContact(null); hapticHeavy();
    const snapshot = { ...ct } as Record<string, unknown>;
    const success = await deleteContact(ct.id);
    if (success) {
      destructive({
        message: `${ct.first_name} excluído`,
        description: 'Clique em Desfazer para restaurar',
        onUndo: () => { void restore('contacts', snapshot, [['contacts']]); },
      });
      logActivity({ type: 'deleted', entityType: 'contact', entityId: ct.id, entityName: ct.first_name });
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    if (id === '__clear__') { setSelectedIds(new Set()); return; }
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) { next.add(id); } else { next.delete(id); }
      return next;
    });
  };

  const handleSelectAll = () => { setSelectedIds(selectedIds.size === filteredAndSortedContacts.length ? new Set() : new Set(filteredAndSortedContacts.map(c => c.id))); };

  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) { await deleteContact(id); }
    setSelectedIds(new Set());
    setSelectionMode(false);
    const plural = ids.length > 1 ? 's' : '';
    accessibleToast.success(`${ids.length} contato${plural} excluído${plural}`);
  };
  const handleBulkAddTag = async (ids: string[], tag: string) => { for (const id of ids) { const contact = contacts.find(c => c.id === id); if (contact) { const currentTags = contact.tags || []; if (!currentTags.includes(tag)) await updateContact(id, { tags: [...currentTags, tag] }); } } setSelectedIds(new Set()); accessibleToast.success(`Tag "${tag}" adicionada a ${ids.length} contato${ids.length > 1 ? 's' : ''}`); };
  const handleBulkUpdateStage = async (ids: string[], stage: any) => { for (const id of ids) { await updateContact(id, { relationship_stage: stage }); } setSelectedIds(new Set()); accessibleToast.success(`Estágio atualizado para ${ids.length} contato${ids.length > 1 ? 's' : ''}`); };

  return (
    <>
      <AppLayout>
        <SEOHead title="Contatos" description="Gestão inteligente de contatos e relacionamentos" />
         <Header title="Contatos" subtitle={`${filteredAndSortedContacts.length} de ${contacts.length} pessoas`} showAddButton addButtonLabel="Novo Contato" onAddClick={() => setIsFormOpen(true)} />

        <div className="px-4 md:px-6 -mt-2 mb-3">
          <ContatosSavedViews
            currentState={{ searchTerm, viewMode, gridColumns, activeFilters, sortBy, sortOrder, multiSort }}
            onApply={(s) => {
              setSearchTerm(s.searchTerm);
              setViewMode(s.viewMode);
              setGridColumns(s.gridColumns);
              setActiveFilters(s.activeFilters);
              setSortBy(s.sortBy);
              setSortOrder(s.sortOrder);
              if (s.multiSort) setMultiSort(s.multiSort);
            }}
          />
        </div>

        <ContatosContent
          contacts={contacts} loading={loading} filteredAndSortedContacts={filteredAndSortedContacts}
          searchTerm={searchTerm} onSearchChange={handleSearchChange}
          viewMode={viewMode} onViewModeChange={setViewMode}
          gridColumns={gridColumns} onGridColumnsChange={setGridColumns}
          activeFilters={activeFilters} onFiltersChange={setActiveFilters}
          sortBy={sortBy} sortOrder={sortOrder} onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); setMultiSort([{ column: sb, order: so }]); }}
          multiSort={multiSort} onMultiSortChange={setMultiSort}
          filterConfigs={dynamicFilterConfigs} sortOptions={sortOptions}
          selectionMode={selectionMode} selectedIds={selectedIds}
          onToggleSelectionMode={() => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedIds(new Set()); }}
          onSelect={handleSelect} onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete} onBulkAddTag={handleBulkAddTag}
          onBulkUpdateStage={handleBulkUpdateStage}
          onSetEditingContact={setEditingContact} onSetDeletingContact={setDeletingContact}
          onSetIsFormOpen={setIsFormOpen} updateContact={updateContact}
          getCompanyName={getCompanyName} getLastInteractionDate={getLastInteractionDate}
          onRefresh={handleRefresh}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <ContactForm companies={companies} onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <ContactForm contact={editingContact} companies={companies} onSubmit={handleUpdate} onCancel={() => setEditingContact(null)} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
              <AlertDialogDescription>Tem certeza que deseja excluir <strong>{deletingContact?.first_name} {deletingContact?.last_name}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <FloatingQuickActions />
        <KeyboardShortcutsCheatsheet open={showShortcuts} onOpenChange={setShowShortcuts} />
      </AppLayout>
      {celebration.MiniCelebrationComponent}
    </>
  );
};

interface ContatosSavedViewsProps {
  currentState: ContatosViewState;
  onApply: (s: ContatosViewState) => void;
}

function ContatosSavedViews({ currentState, onApply }: ContatosSavedViewsProps) {
  const sv = useSavedViews<ContatosViewState>('contatos');
  return (
    <SavedViewsBar
      scope="contatos"
      views={sv.views}
      currentState={currentState}
      onSave={sv.save}
      onApply={(v) => { sv.apply(v); onApply(v.state); }}
      onRemove={sv.remove}
      onToggleFavorite={sv.toggleFavorite}
      onSetDefault={sv.setDefault}
      shareUrl={sv.shareUrl}
    />
  );
}

export default Contatos;
