import { useState, useMemo, useEffect, useRef, startTransition, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { List as VirtualList } from 'react-window';
import { UserPlus, Upload, CheckSquare, Globe } from 'lucide-react';
import { ContactsGridSkeleton, ContactsListSkeleton } from '@/components/skeletons/PageSkeletons';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { SwipeableListItem } from '@/components/ui/swipeable-list-item';
import { Button } from '@/components/ui/button';
import { AdvancedFilters, type FilterConfig, type SortOption, type SortCriteria } from '@/components/filters/AdvancedFilters';
import { ContactCardWithContext } from '@/components/contact-card/ContactCardWithContext';
import { ContactsStatsBar } from '@/components/contacts/ContactsStatsBar';
import { BulkActionsBar } from '@/components/bulk-actions/BulkActionsBar';
import { BulkImportDialog } from '@/components/import/BulkImportDialog';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ContactsTableView } from '@/components/contacts/ContactsTableView';
import { BirthdayWidget } from '@/components/contacts/BirthdayWidget';
import { RecentlyViewedSection } from '@/components/recently-viewed/RecentlyViewedSection';
import { SearchPresetsMenu } from '@/components/search/SearchPresetsMenu';
import { ViewModeSwitcher, type ViewMode, type GridColumns } from '@/components/ui/view-mode-switcher';
import { Header } from '@/components/layout/Header';
import { exportToCSV } from '@/lib/export-utils';
import type { SearchPreset } from '@/hooks/useSearchPresets';
import type { Contact } from '@/hooks/useContacts';

const DuplicateContactsPanel = lazy(() => import('@/components/contacts/DuplicateContactsPanel'));
const ExternalContactLookupDialog = lazy(() => import('@/components/contacts/ExternalContactLookupDialog').then(m => ({ default: m.ExternalContactLookupDialog })));

interface Props {
  contacts: Contact[];
  loading: boolean;
  filteredAndSortedContacts: Contact[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  gridColumns: GridColumns;
  onGridColumnsChange: (cols: GridColumns) => void;
  activeFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  multiSort?: SortCriteria[];
  onMultiSortChange?: (criteria: SortCriteria[]) => void;
  filterConfigs: FilterConfig[];
  sortOptions: SortOption[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelectionMode: () => void;
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkAddTag: (ids: string[], tag: string) => Promise<void>;
  onBulkUpdateStage: (ids: string[], stage: string) => Promise<void>;
  onSetEditingContact: (contact: Contact | null) => void;
  onSetDeletingContact: (contact: Contact | null) => void;
  onSetIsFormOpen: (open: boolean) => void;
  updateContact: (id: string, data: Partial<Contact>) => Promise<Contact | null>;
  getCompanyName: (companyId: string | null) => string | null;
  getLastInteractionDate: (contactId: string) => string | null;
  onRefresh: () => Promise<void>;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function ContatosContent(props: Props) {
  const {
    contacts, loading, filteredAndSortedContacts, searchTerm, onSearchChange,
    viewMode, onViewModeChange, gridColumns, onGridColumnsChange,
    activeFilters, onFiltersChange, sortBy, sortOrder, onSortChange,
    multiSort, onMultiSortChange,
    filterConfigs, sortOptions, selectionMode, selectedIds,
    onToggleSelectionMode, onSelect, onSelectAll, onBulkDelete, onBulkAddTag, onBulkUpdateStage,
    onSetEditingContact, onSetDeletingContact, onSetIsFormOpen,
    updateContact, getCompanyName, getLastInteractionDate, onRefresh,
    hasMore, onLoadMore,
  } = props;

  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [isExternalSearchOpen, setIsExternalSearchOpen] = useState(false);
  const RENDER_BATCH = 50;
  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Real list navigation implementation
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const direction = (e as CustomEvent<'next' | 'prev'>).detail;
      setSelectedIndex(prev => {
        let next = direction === 'next' ? prev + 1 : prev - 1;
        if (next < 0) next = filteredAndSortedContacts.length - 1;
        if (next >= filteredAndSortedContacts.length) next = 0;
        return next;
      });
    };
    
    const handleOpen = () => {
      const contact = filteredAndSortedContacts[selectedIndex];
      if (contact) navigate(`/contatos/${contact.id}`);
    };

    window.addEventListener('navigate-list', handleNavigate);
    window.addEventListener('open-selected-item', handleOpen);
    return () => {
      window.removeEventListener('navigate-list', handleNavigate);
      window.removeEventListener('open-selected-item', handleOpen);
    };
  }, [filteredAndSortedContacts, selectedIndex, navigate]);

  useEffect(() => { setVisibleCount(RENDER_BATCH); }, [activeFilters, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { 
      if (entry.isIntersecting) {
        startTransition(() => {
          // eslint-disable-next-line sonarjs/no-nested-functions
          setVisibleCount(prev => {
            const next = prev + RENDER_BATCH;
            // Se chegamos perto do fim do que temos em memória, e há mais no servidor, carrega mais.
            if (next >= filteredAndSortedContacts.length && hasMore && onLoadMore) {
              onLoadMore();
            }
            return next;
          });
        });
      }
    }, { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredAndSortedContacts.length, hasMore, onLoadMore]);

  const visibleContacts = useMemo(() => filteredAndSortedContacts.slice(0, visibleCount), [filteredAndSortedContacts, visibleCount]);
  const hasMoreContacts = visibleCount < filteredAndSortedContacts.length;

  const handleBulkExport = async (ids: string[]) => {
    const dataToExport = contacts.filter(c => ids.includes(c.id)).map(c => ({
      Nome: `${c.first_name} ${c.last_name}`,
      Empresa: getCompanyName(c.company_id) || '',
      Cargo: c.role_title || '',
      Email: (c as Contact & { email?: string }).email || '',
      Telefone: (c as Contact & { phone?: string }).phone || '',
      Score: c.relationship_score || 0,
      Estagio: c.relationship_stage || '',
      Sentimento: c.sentiment || '',
      Tags: Array.isArray((c as Contact & { tags?: string[] }).tags)
        ? ((c as Contact & { tags?: string[] }).tags as string[]).join('; ')
        : ''
    }));
    exportToCSV(dataToExport, 'contatos_export');
  };

  return (
    <>
      <div className="sticky top-[57px] z-20 w-full">
        <Header 
          title="Contatos" 
          subtitle={`${filteredAndSortedContacts.length} de ${contacts.length} pessoas`}
          showAddButton 
          addButtonLabel="Novo" 
          onAddClick={() => onSetIsFormOpen(true)}
          hideBack
          showSearch
          onSearchChange={onSearchChange}
          className="shadow-none border-b-0"
        />
      </div>

      <div className="p-4 md:p-6 space-y-5">
        <Suspense fallback={null}><DuplicateContactsPanel /></Suspense>
        <ContactsStatsBar contacts={contacts} />
        <BirthdayWidget />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 ml-auto h-11 md:h-9">
            <SearchPresetsMenu context="contacts" currentFilters={activeFilters} currentSortBy={sortBy} currentSortOrder={sortOrder} currentSearchTerm={searchTerm}
              onApplyPreset={(preset: SearchPreset) => { onFiltersChange(preset.filters); onSortChange(preset.sortBy, preset.sortOrder); if (preset.searchTerm) onSearchChange(preset.searchTerm); }} />
            <Button variant="outline" size="sm" onClick={() => setIsExternalSearchOpen(true)} className="gap-2 h-11 px-4 md:h-9 md:px-3 text-sm md:text-xs">
              <Globe className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">Busca Externa</span>
            </Button>
            {isAdmin && <BulkImportDialog entityType="contacts" />}
            <Button variant={selectionMode ? 'default' : 'outline'} size="sm" onClick={onToggleSelectionMode} className="gap-2 h-11 px-4 md:h-9 md:px-3 text-sm md:text-xs">
              <CheckSquare className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">{selectionMode ? 'Cancelar' : 'Selecionar'}</span>
            </Button>
            <ViewModeSwitcher value={viewMode} onChange={onViewModeChange} gridColumns={gridColumns} onGridColumnsChange={onGridColumnsChange} />
          </div>
        </div>

        <div className="md:block">
          <AdvancedFilters 
            filters={filterConfigs} 
            sortOptions={sortOptions} 
            activeFilters={activeFilters} 
            onFiltersChange={onFiltersChange} 
            sortBy={sortBy} 
            sortOrder={sortOrder} 
            onSortChange={(newSortBy, newSortOrder) => onSortChange(newSortBy, newSortOrder)} 
            multiSort={multiSort}
            onMultiSortChange={onMultiSortChange}
          />
        </div>
      <RecentlyViewedSection type="contact" />

      <PullToRefresh onRefresh={onRefresh}>
        {loading ? (viewMode === 'grid' ? <ContactsGridSkeleton /> : <ContactsListSkeleton />) : (
          <>
            {viewMode === 'grid' && (
              <>
                <div className={`grid grid-cols-1 gap-5 ${gridColumns === 2 ? 'md:grid-cols-2' : gridColumns === 3 ? 'md:grid-cols-2 xl:grid-cols-3' : gridColumns === 4 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : gridColumns === 5 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'}`}>
                  {visibleContacts.map((contact, index) => (
                    <ContactCardWithContext key={contact.id} contact={contact} companyName={getCompanyName(contact.company_id)} lastInteraction={getLastInteractionDate(contact.id)} index={index} isSelected={selectedIds.has(contact.id)} isHighlighted={selectedIndex === index} selectionMode={selectionMode} onSelect={onSelect} onEdit={onSetEditingContact} onDelete={onSetDeletingContact} onUpdate={updateContact} viewMode="grid" />
                  ))}
                </div>
                {hasMoreContacts && <div ref={sentinelRef} className="flex items-center justify-center py-6 text-sm text-muted-foreground animate-pulse">Carregando mais contatos...</div>}
              </>
            )}

            {viewMode === 'list' && (
              filteredAndSortedContacts.length > 50 ? (
                <VirtualList rowCount={filteredAndSortedContacts.length} rowHeight={88} rowProps={{ contacts: filteredAndSortedContacts, getCompanyName, getLastInteractionDate, selectedIds, selectedIndex, selectionMode, handleSelect: onSelect, setEditingContact: onSetEditingContact, setDeletingContact: onSetDeletingContact, updateContact }} style={{ height: Math.min(filteredAndSortedContacts.length * 88, 600) }}
                  rowComponent={({ index, style, ...rp }) => {
                    const c = rp.contacts[index];
                    if (!c) { return null; }
                    return (<div style={style} className="pb-2"><ContactCardWithContext contact={c} companyName={rp.getCompanyName(c.company_id)} lastInteraction={rp.getLastInteractionDate(c.id)} index={index} isSelected={rp.selectedIds.has(c.id)} isHighlighted={rp.selectedIndex === index} selectionMode={rp.selectionMode} onSelect={rp.handleSelect} onEdit={rp.setEditingContact} onDelete={rp.setDeletingContact} onUpdate={rp.updateContact} viewMode="list" /></div>);
                  }} />
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedContacts.map((contact, index) => (
                    <SwipeableListItem key={contact.id} onDelete={() => onSetDeletingContact(contact)} onArchive={() => updateContact(contact.id, { relationship_stage: 'churned' } as Partial<Contact>)}>
                      <ContactCardWithContext contact={contact} companyName={getCompanyName(contact.company_id)} lastInteraction={getLastInteractionDate(contact.id)} index={index} isSelected={selectedIds.has(contact.id)} isHighlighted={selectedIndex === index} selectionMode={selectionMode} onSelect={onSelect} onEdit={onSetEditingContact} onDelete={onSetDeletingContact} onUpdate={updateContact} viewMode="list" />
                    </SwipeableListItem>
                  ))}
                </div>
              )
            )}

            {viewMode === 'table' && (
              <ContactsTableView contacts={filteredAndSortedContacts} selectionMode={selectionMode} selectedIds={selectedIds} onSelect={onSelect} getCompanyName={getCompanyName} getLastInteractionDate={getLastInteractionDate} sortBy={sortBy} sortOrder={sortOrder} onSortChange={(field) => { if (sortBy === field) onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc'); else onSortChange(field, 'asc'); }} />
            )}

            {filteredAndSortedContacts.length === 0 && !loading && (
              searchTerm || Object.keys(activeFilters).length > 0
                ? <SearchEmptyState searchTerm={searchTerm || 'filtros ativos'} onClearSearch={() => { onSearchChange(''); onFiltersChange({}); }} entityName="contatos" />
                : <EmptyState illustration="contacts" title="Sua rede de contatos começa aqui" description="Adicione seu primeiro contato para começar a gerenciar seus relacionamentos profissionais de forma inteligente." actions={[{ label: 'Adicionar Contato', onClick: () => onSetIsFormOpen(true), icon: UserPlus }, { label: 'Importar CSV', onClick: () => {}, variant: 'outline', icon: Upload }]} tips={['Adicione informações como cargo e empresa para contextualizar', 'Use tags para organizar seus contatos por projeto ou área', 'O perfil DISC ajuda a personalizar sua comunicação']} />
            )}
          </>
        )}
      </PullToRefresh>

      <BulkActionsBar 
        selectedIds={Array.from(selectedIds)} 
        totalCount={filteredAndSortedContacts.length} 
        entityType="contacts" 
        onSelectAll={onSelectAll} 
        onClearSelection={() => onSelect('__clear__', false)} 
        onDelete={onBulkDelete} 
        onAddTag={onBulkAddTag}
        onUpdateStage={onBulkUpdateStage}
        onExport={handleBulkExport}
      />

      <Suspense fallback={null}>
        <ExternalContactLookupDialog 
          open={isExternalSearchOpen} 
          onOpenChange={setIsExternalSearchOpen} 
        />
      </Suspense>
    </div>
    </>
  );
}
