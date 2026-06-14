import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useModalHistory } from '@/hooks/useModalHistory';
import {
  Building2, Users, MessageSquare, Search, Zap, Mic, Sparkles, MessageCircleQuestion, ArrowRight,
  LayoutDashboard, CalendarDays, Lightbulb, Bell, Settings,
  UserPlus, Building, MessagesSquare,
} from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { toTitleCase } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryExternalData } from '@/lib/externalData';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import { useConversationalSearch } from '@/hooks/useConversationalSearch';
import type { SearchContact } from '@/hooks/useSearchContactsView';
import { SearchResultGroups } from './global-search/SearchResultGroups';
import { SearchLocalGroups } from './global-search/SearchLocalGroups';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const LazyVoiceOverlay = lazy(() => import('./VoiceSearchOverlayConnected'));

interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'interaction';
  title: string;
  subtitle?: string;
  meta?: string;
}

interface RecentItem {
  id: string;
  type: 'contact' | 'company' | 'interaction' | 'page';
  title: string;
  path: string;
  timestamp: number;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceMode?: boolean;
  onVoiceModeChange?: (open: boolean) => void;
}

const navigationItems = [
  { key: '1', path: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Visão geral e métricas' },
  { key: '2', path: '/empresas', label: 'Empresas', icon: Building2, description: 'Gerenciar empresas' },
  { key: '3', path: '/contatos', label: 'Contatos', icon: Users, description: 'Gerenciar contatos' },
  { key: '4', path: '/interacoes', label: 'Interações', icon: MessageSquare, description: 'Histórico de interações' },
  { key: '5', path: '/calendario', label: 'Calendário', icon: CalendarDays, description: 'Eventos e lembretes' },
  { key: '6', path: '/insights', label: 'Insights', icon: Lightbulb, description: 'Análises e tendências' },
  { key: '7', path: '/notificacoes', label: 'Notificações', icon: Bell, description: 'Alertas e avisos' },
  { key: '8', path: '/configuracoes', label: 'Configurações', icon: Settings, description: 'Preferências do sistema' },
];

const quickActions = [
  { id: 'new-contact', label: 'Novo Contato', description: 'Adicionar um novo contato à sua rede', icon: UserPlus, shortcut: 'C', color: 'primary', path: '/contatos?new=true' },
  { id: 'new-company', label: 'Nova Empresa', description: 'Cadastrar uma nova empresa', icon: Building, shortcut: 'E', color: 'accent', path: '/empresas?new=true' },
  { id: 'new-interaction', label: 'Nova Interação', description: 'Registrar uma nova interação', icon: MessagesSquare, shortcut: 'I', color: 'warning', path: '/interacoes?new=true' },
];

const RECENT_ITEMS_KEY = 'command-palette-recent';
const MAX_RECENT_ITEMS = 5;

function getRecentItems(): RecentItem[] {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function addRecentItem(item: Omit<RecentItem, 'timestamp'>) {
  const recent = getRecentItems();
  const filtered = recent.filter(r => !(r.id === item.id && r.type === item.type));
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify([{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_ITEMS)));
}

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export const GlobalSearch = React.forwardRef<HTMLDivElement, GlobalSearchProps>(({ open, onOpenChange, voiceMode = false, onVoiceModeChange }, ref) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ contacts: SearchResult[]; companies: SearchResult[]; interactions: SearchResult[] }>({ contacts: [], companies: [], interactions: [] });
  const [voiceOpenInternal, setVoiceOpenInternal] = useState(false);
  const voiceOpen = voiceMode || voiceOpenInternal;
  const setVoiceOpen = useCallback((v: boolean) => { setVoiceOpenInternal(v); onVoiceModeChange?.(v); }, [onVoiceModeChange]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [semanticMode, setSemanticMode] = useState<boolean>(() => {
    try { return localStorage.getItem('global-search-semantic') === '1'; } catch { return false; }
  });
  const [conversationalMode, setConversationalMode] = useState<boolean>(() => {
    try { return localStorage.getItem('global-search-conversational') === '1'; } catch { return false; }
  });
  const [convDraft, setConvDraft] = useState('');
  const {
    search: semanticSearch,
    reset: resetSemantic,
    loading: semanticLoading,
    cached: semanticCached,
    variations: semanticVariations,
  } = useSemanticSearch();
  const {
    ask: convAsk,
    reset: resetConversational,
    loading: convLoading,
    interpretation: convInterpretation,
    items: convItems,
    history: convHistory,
  } = useConversationalSearch();
  // Stable views over hook returns (avoid passing whole objects into deps).
  const semantic = useMemo(
    () => ({ search: semanticSearch, reset: resetSemantic, loading: semanticLoading, cached: semanticCached, variations: semanticVariations }),
    [semanticSearch, resetSemantic, semanticLoading, semanticCached, semanticVariations],
  );
  const conv = useMemo(
    () => ({ ask: convAsk, reset: resetConversational, loading: convLoading, interpretation: convInterpretation, items: convItems, history: convHistory }),
    [convAsk, resetConversational, convLoading, convInterpretation, convItems, convHistory],
  );
  const navigate = useNavigate();
  const { user } = useAuth();

  useModalHistory(open, () => onOpenChange(false), 'global-search');

  const navigationFuse = useMemo(() => new Fuse(navigationItems, {
    keys: ['label', 'description'], threshold: 0.4, ignoreLocation: true,
    getFn: (obj, path) => { const value = Fuse.config.getFn(obj, path); if (typeof value === 'string') return normalizeText(value); if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? normalizeText(v) : v); return value; },
  }), []);
  const quickActionsFuse = useMemo(() => new Fuse(quickActions, {
    keys: ['label', 'description'], threshold: 0.4, ignoreLocation: true,
    getFn: (obj, path) => { const value = Fuse.config.getFn(obj, path); if (typeof value === 'string') return normalizeText(value); if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? normalizeText(v) : v); return value; },
  }), []);

  const filteredNavigation = useMemo(() => query.trim() ? navigationFuse.search(normalizeText(query)).map(r => r.item) : navigationItems, [query, navigationFuse]);
  const filteredQuickActions = useMemo(() => query.trim() ? quickActionsFuse.search(normalizeText(query)).map(r => r.item) : quickActions, [query, quickActionsFuse]);
  const filteredRecent = useMemo(() => {
    if (!query.trim()) return recentItems;
    return new Fuse(recentItems, { keys: ['title'], threshold: 0.4, ignoreLocation: true }).search(query).map(r => r.item);
  }, [query, recentItems]);

  // Read ?q= from URL only when palette opens (deep-link entry). No reactive sync to avoid infinite loops.
  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q') ?? '';
    setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
    setRecentItems(getRecentItems());
  }, [open]);

  useEffect(() => { if (!open) return; const handleKeyDown = (e: KeyboardEvent) => { if (e.altKey && !e.ctrlKey && !e.metaKey) { const action = quickActions.find(a => a.shortcut.toLowerCase() === e.key.toLowerCase()); if (action) { e.preventDefault(); handleQuickAction(action); return; } const navItem = navigationItems.find(n => n.key === e.key); if (navItem) { e.preventDefault(); handleNavigate(navItem.path, navItem.label); } } }; document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [open]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user) { setResults({ contacts: [], companies: [], interactions: [] }); return; }

    if (semanticMode) {
      const sem = await semanticSearch(searchQuery.trim(), {
        entities: ['contacts', 'companies', 'interactions'],
        limit: 8,
        silent: true,
      });
      setResults({
        contacts: sem.contacts.map(c => ({
          id: c.id, type: 'contact' as const,
          title: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Contato',
          subtitle: c.role_title || c.email || undefined,
          meta: c.phone || undefined,
        })),
        companies: sem.companies.map(c => ({
          id: c.id, type: 'company' as const,
          title: toTitleCase(c.name),
          subtitle: c.industry || undefined,
          meta: c.city && c.state ? `${c.city}, ${c.state}` : undefined,
        })),
        interactions: sem.interactions.map(i => ({
          id: i.id, type: 'interaction' as const,
          title: i.title || 'Interação',
          subtitle: i.type,
          meta: new Date(i.created_at).toLocaleDateString('pt-BR'),
        })),
      });
      return;
    }

    setIsLoading(true);
    try {
      const [contactsResponse, companiesResponse, interactionsResponse] = await Promise.all([
        supabase.rpc('search_contacts_unaccent', { p_user_id: user.id, p_query: searchQuery.trim(), p_limit: 5 }),
        supabase.rpc('search_companies_unaccent', { p_user_id: user.id, p_query: searchQuery.trim(), p_limit: 5 }),
        supabase.rpc('search_interactions_unaccent', { p_user_id: user.id, p_query: searchQuery.trim(), p_limit: 5 }),
      ]);
      if (contactsResponse.error || companiesResponse.error || interactionsResponse.error) throw contactsResponse.error || companiesResponse.error || interactionsResponse.error;

      let externalContacts: SearchResult[] = [];
      try {
        const { data: extResults } = await queryExternalData<SearchContact>({ table: 'vw_search_contacts', search: { term: searchQuery.trim(), columns: ['full_name', 'nome_tratamento', 'email', 'phone'] }, range: { from: 0, to: 4 } });
        if (extResults?.length) {
          const localIds = new Set(contactsResponse.data?.map(c => c.id) || []);
          externalContacts = extResults.filter(e => !localIds.has(e.id)).map(e => ({ id: e.id, type: 'contact' as const, title: e.full_name, subtitle: e.company || e.email || undefined, meta: e.phone || undefined }));
        }
      } catch { /* best-effort */ }

      setResults({
        contacts: [...(contactsResponse.data?.map(c => ({ id: c.id, type: 'contact' as const, title: `${c.first_name} ${c.last_name}`, subtitle: c.role_title || c.email, meta: c.phone })) || []), ...externalContacts],
        companies: companiesResponse.data?.map(c => ({ id: c.id, type: 'company' as const, title: toTitleCase(c.name), subtitle: c.industry, meta: c.city && c.state ? `${c.city}, ${c.state}` : undefined })) || [],
        interactions: interactionsResponse.data?.map(i => ({ id: i.id, type: 'interaction' as const, title: i.title, subtitle: i.type, meta: new Date(i.created_at).toLocaleDateString('pt-BR') })) || [],
      });
    } catch (error) { 
      const msg = error instanceof Error ? error.message : 'Não foi possível completar a busca agora.';
      logger.error('Search error:', { error: msg }); 
      toast.error(msg); 
      setResults({ contacts: [], companies: [], interactions: [] }); 
    } finally { setIsLoading(false); }
  }, [user, semanticMode, semanticSearch]);

  useEffect(() => {
    if (conversationalMode) return; // não disparar lexical/semântica em modo conversacional
    const timer = setTimeout(() => performSearch(query), semanticMode ? 450 : 300);
    return () => clearTimeout(timer);
  }, [query, performSearch, semanticMode, conversationalMode]);
  useEffect(() => {
    if (open) return;
    setQuery('');
    setResults({ contacts: [], companies: [], interactions: [] });
    setConvDraft('');
    resetSemantic();
    resetConversational();
  }, [open, resetSemantic, resetConversational]);

  const toggleSemantic = useCallback(() => {
    setSemanticMode(prev => {
      const next = !prev;
      try { localStorage.setItem('global-search-semantic', next ? '1' : '0'); } catch { /* noop */ }
      if (next) {
        setConversationalMode(false);
        try { localStorage.setItem('global-search-conversational', '0'); } catch { /* noop */ }
      }
      return next;
    });
  }, []);

  const toggleConversational = useCallback(() => {
    setConversationalMode(prev => {
      const next = !prev;
      try { localStorage.setItem('global-search-conversational', next ? '1' : '0'); } catch { /* noop */ }
      if (next) {
        setSemanticMode(false);
        try { localStorage.setItem('global-search-semantic', '0'); } catch { /* noop */ }
        resetConversational();
      }
      return next;
    });
  }, [resetConversational]);

  const submitConversational = useCallback(async (q?: string) => {
    if (!user) return;
    const text = (q ?? convDraft).trim();
    if (text.length < 3) return;
    setConvDraft(text);
    await convAsk(text, user.id);
  }, [convAsk, convDraft, user]);

  const handleConvItemSelect = useCallback((item: { id: string; entity: string }) => {
    onOpenChange(false);
    if (item.entity === 'contacts') navigate(`/contatos/${item.id}`);
    else if (item.entity === 'companies') navigate(`/empresas/${item.id}`);
    else if (item.entity === 'interactions') navigate('/interacoes');
    else if (item.entity === 'deals') navigate('/pipeline');
  }, [navigate, onOpenChange]);

  const handleNavigate = (path: string, label: string) => { onOpenChange(false); addRecentItem({ id: path, type: 'page', title: label, path }); navigate(path); };
  const handleSelect = (result: SearchResult) => { onOpenChange(false); const path = result.type === 'contact' ? `/contatos/${result.id}` : result.type === 'company' ? `/empresas/${result.id}` : '/interacoes'; addRecentItem({ id: result.id, type: result.type, title: result.title, path }); navigate(path); };
  const handleQuickAction = (action: typeof quickActions[0]) => { onOpenChange(false); navigate(action.path); };
  const handleRecentSelect = (item: RecentItem) => { onOpenChange(false); navigate(item.path); };

  const hasResults = results.contacts.length > 0 || results.companies.length > 0 || results.interactions.length > 0;
  const hasLocalResults = filteredNavigation.length > 0 || filteredQuickActions.length > 0 || filteredRecent.length > 0;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  const effectiveLoading = semanticMode ? semantic.loading : isLoading;

  return (
    <>
      <CommandDialog ref={ref} open={open} onOpenChange={onOpenChange} shouldFilter={false}>
        <div className="flex items-center justify-between gap-2 px-3 border-b border-border">
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /><span className="text-xs font-medium text-muted-foreground">Super Command Palette</span></div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSemantic}
              aria-pressed={semanticMode}
              title={semanticMode ? 'Busca Inteligente IA: ativada' : 'Ativar busca inteligente IA'}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                semanticMode ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/70 text-muted-foreground',
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">IA</span>
            </button>
            <button
              type="button"
              onClick={toggleConversational}
              aria-pressed={conversationalMode}
              title={conversationalMode ? 'Modo Pergunte: ativado' : 'Pergunte em linguagem natural'}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                conversationalMode ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/70 text-muted-foreground',
              )}
            >
              <MessageCircleQuestion className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pergunte</span>
            </button>
            <button onClick={() => { onOpenChange(false); setVoiceOpen(true); }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors" aria-label="Assistente de Voz"><Mic className="w-3.5 h-3.5" /><span className="hidden sm:inline">Voz</span></button>
          </div>
        </div>

        {conversationalMode ? (
          <div className="px-3 pt-3 pb-2 border-b border-border space-y-2">
            <Textarea
              autoFocus
              value={convDraft}
              onChange={(e) => setConvDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitConversational(); }
              }}
              placeholder="Pergunte em linguagem natural… ex: contatos de SP que não falo há 30 dias"
              className="min-h-[68px] resize-none text-sm"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {['Contatos sem follow-up há 30 dias', 'Empresas de tecnologia em SP', 'Interações negativas esta semana'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setConvDraft(s); submitConversational(s); }}
                  className="px-2 py-1 rounded-md bg-muted hover:bg-muted/70 text-[11px] text-muted-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => submitConversational()}
                disabled={conv.loading || convDraft.trim().length < 3}
                className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {conv.loading ? 'Pensando…' : 'Buscar'}
                {!conv.loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
            {conv.history.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Histórico:</span>
                {conv.history.slice(0, 5).map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => { setConvDraft(h); submitConversational(h); }}
                    className="px-1.5 py-0.5 rounded bg-muted/60 text-[11px] text-muted-foreground/90 hover:bg-muted truncate max-w-[180px]"
                    title={h}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <CommandInput placeholder={semanticMode ? 'Busca semântica: descreva o que procura…' : 'Buscar contatos, empresas, navegar ou executar ações...'} value={query} onValueChange={setQuery} />
        )}

        <CommandList className="max-h-[400px]">
          {conversationalMode ? (
            <div className="p-2">
              {conv.loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Interpretando pergunta com IA…</p>
                  </div>
                </div>
              )}
              {!conv.loading && conv.interpretation && (
                <div className="px-3 py-2 mb-1 rounded-md bg-primary/5 border border-primary/20 flex items-start gap-2">
                  <MessageCircleQuestion className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-xs flex-1">
                    <p className="font-medium text-foreground">Interpretação da IA</p>
                    <p className="text-muted-foreground mt-0.5">{conv.interpretation.summary}</p>
                    {conv.interpretation.cached && (
                      <span className="text-[10px] uppercase tracking-wide text-primary/70 mt-1 inline-block">cache</span>
                    )}
                  </div>
                </div>
              )}
              {!conv.loading && conv.items.length > 0 && (
                <div className="space-y-0.5">
                  {conv.items.map(item => (
                    <button
                      key={`${item.entity}-${item.id}`}
                      type="button"
                      onClick={() => handleConvItemSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {item.entity === 'contacts' && <Users className="w-4 h-4 text-muted-foreground" />}
                        {item.entity === 'companies' && <Building2 className="w-4 h-4 text-muted-foreground" />}
                        {item.entity === 'interactions' && <MessageSquare className="w-4 h-4 text-muted-foreground" />}
                        {item.entity === 'deals' && <Zap className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
                      </div>
                      {item.meta && <span className="text-[11px] text-muted-foreground shrink-0">{item.meta}</span>}
                    </button>
                  ))}
                </div>
              )}
              {!conv.loading && conv.interpretation && conv.items.length === 0 && conv.interpretation.entity !== 'deals' && (
                <CommandEmpty>
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum registro corresponde aos filtros interpretados.
                  </div>
                </CommandEmpty>
              )}
              {!conv.loading && conv.interpretation?.entity === 'deals' && (
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); navigate('/pipeline'); }}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/70 text-sm font-medium transition-colors"
                >
                  Abrir Pipeline com filtros <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {!conv.loading && !conv.interpretation && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Faça uma pergunta para começar — exemplos abaixo do campo.
                </div>
              )}
            </div>
          ) : (
            <>
              {query && !effectiveLoading && <div className="sr-only" aria-live="polite" aria-atomic="true">{hasResults ? `${results.contacts.length + results.companies.length + results.interactions.length} resultados encontrados` : 'Nenhum resultado encontrado'}</div>}
              {query && effectiveLoading && <div className="flex items-center justify-center py-8"><div className="flex flex-col items-center gap-3"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /><p className="text-sm text-muted-foreground">{semanticMode ? 'Buscando com IA...' : 'Buscando...'}</p></div></div>}
              {semanticMode && hasResults && semantic.variations.length > 1 && (
                <div className="px-4 py-1.5 text-[11px] text-muted-foreground border-b border-border/50 flex flex-wrap items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Termos relacionados:</span>
                  {semantic.variations.slice(1, 5).map(v => (
                    <span key={v} className="px-1.5 py-0.5 rounded bg-muted/60">{v}</span>
                  ))}
                  {semantic.cached && <span className="ml-auto text-[10px] opacity-60">cache</span>}
                </div>
              )}

              <SearchResultGroups results={results} onSelect={handleSelect} />

              {query && !hasResults && !hasLocalResults && !effectiveLoading && (
                <CommandEmpty><div className="flex flex-col items-center gap-3 py-8"><div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Search className="w-6 h-6 text-muted-foreground" /></div><div className="text-center"><p className="font-medium">Nenhum resultado para "{query}"</p><p className="text-sm text-muted-foreground mt-1">{semanticMode ? 'Tente palavras diferentes ou desative a busca IA' : 'Tente buscar por nome, email, empresa ou título'}</p></div></div></CommandEmpty>
              )}

              <SearchLocalGroups query={query} filteredQuickActions={filteredQuickActions} filteredNavigation={filteredNavigation} filteredRecent={filteredRecent} onQuickAction={handleQuickAction} onNavigate={handleNavigate} onRecentSelect={handleRecentSelect} />
            </>
          )}
        </CommandList>

        <div className="border-t border-border p-2.5 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">↑↓</kbd><span>navegar</span></span>
              <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">↵</kbd><span>selecionar</span></span>
              <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">esc</kbd><span>fechar</span></span>
            </div>
            <div className="flex items-center gap-1.5"><span className="text-muted-foreground/70">Abrir com</span><kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">{modKey}</kbd><kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono shadow-sm">K</kbd></div>
          </div>
        </div>
      </CommandDialog>

      {voiceOpen && (
        <Suspense fallback={null}>
          <LazyVoiceOverlay isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} onAction={(action) => {
            if (action.action === 'navigate' && action.data?.route) navigate(action.data.route);
            else if (action.action === 'search') { const sq = action.data?.query || action.data?.contactName || action.data?.filters?.company || action.data?.filters?.tag || action.data?.filters?.sentiment || ''; if (sq) { setVoiceOpen(false); onOpenChange(true); setQuery(sq); } }
            else if (action.action === 'create_interaction' && action.data?.contactName) { setVoiceOpen(false); toast.info(`Para registrar interação com ${action.data.contactName}, abra o contato e clique em "Nova Interação".`); onOpenChange(true); setQuery(action.data.contactName); }
             else if (action.action === 'create_reminder' && action.data?.contactName) { setVoiceOpen(false); toast.info(`Lembrete sugerido: ${action.response}`); onOpenChange(true); setQuery(action.data.contactName); }
             else if (action.action === 'create_relative' && action.data?.contactName) {
               setVoiceOpen(false);
               const relInfo = action.data.relative?.name || action.data.relative?.relationship || 'familiar';
               toast.info(`Sugestão de novo relacionado (${relInfo}) para ${action.data.contactName}`);
               onOpenChange(true);
               setQuery(action.data.contactName);
             }
             else if (action.action === 'update_preferences' && action.data?.contactName) {
               setVoiceOpen(false);
               toast.info(`Sugestão de atualização de preferências para ${action.data.contactName}: ${action.response}`);
               onOpenChange(true);
               setQuery(action.data.contactName);
             }
          }} />
        </Suspense>
      )}
    </>
  );
});

GlobalSearch.displayName = 'GlobalSearch';
