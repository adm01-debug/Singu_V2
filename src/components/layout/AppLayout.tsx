import { ReactNode, useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Command, Settings, LogOut, ChevronRight, Mic } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { GlobalCommandBar } from '@/components/command/GlobalCommandBar';
import { QuickAddButton } from '@/components/quick-add/QuickAddButton';
import { SlowQueryIndicator } from '@/components/feedback/SlowQueryIndicator';
import { AIEmailComposerTrigger } from '@/components/ai/AIEmailComposerTrigger';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { generateRequestId, setRequestId, setLogUser } from '@/lib/logger';

// Heavy global chrome — lazy + deferred to idle to avoid blocking route transitions
const AskCrmChat = lazy(() => import('@/components/ask-crm/AskCrmChat').then(m => ({ default: m.AskCrmChat })));
const AIEmailComposer = lazy(() => import('@/components/ai/AIEmailComposer').then(m => ({ default: m.AIEmailComposer })));
const OnboardingTourWrapper = lazy(() => import('@/components/onboarding/OnboardingTourWrapper').then(m => ({ default: m.OnboardingTourWrapper })));
const KeyboardShortcutsCheatsheet = lazy(() => import('@/components/keyboard/KeyboardShortcutsCheatsheet').then(m => ({ default: m.KeyboardShortcutsCheatsheet })));
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import { SkipToContent } from '@/components/navigation/NavigationPatterns';
import { PageTransition } from '@/components/navigation/PageTransition';
import { SwipeBackIndicator } from '@/components/navigation/SwipeBackIndicator';
import { RouteProgressBar } from '@/components/navigation/RouteProgressBar';
import { ScrollToTopButton } from '@/components/navigation/ScrollToTopButton';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/empresas': 'Empresas',
  '/contatos': 'Contatos',
  '/interacoes': 'Conversas',
  '/calendario': 'Calendário',
  '/network': 'Network',
  '/insights': 'Insights',
  '/analytics': 'Analytics',
  '/mapa-empresas': 'Mapa',
  '/automacoes': 'Automações',
  '/notificacoes': 'Notificações',
  '/configuracoes': 'Configurações',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title;
  }
  return 'Página';
}

/** Returns breadcrumb segments for detail pages e.g. /contatos/123 → [{label:"Contatos", path:"/contatos"}, {label:"Detalhe"}] */
function getBreadcrumbs(pathname: string, pageTitle: string): { label: string; path?: string }[] {
  const PARENT_ROUTES: Record<string, { label: string; path: string }> = {
    '/contatos': { label: 'Contatos', path: '/contatos' },
    '/empresas': { label: 'Empresas', path: '/empresas' },
    '/interacoes': { label: 'Conversas', path: '/interacoes' },
  };

  for (const [prefix, parent] of Object.entries(PARENT_ROUTES)) {
    if (pathname.startsWith(prefix + '/') && pathname !== prefix) {
      return [parent, { label: 'Detalhe' }];
    }
  }

  return [{ label: pageTitle }];
}

function AppLayoutInner({ children, title }: AppLayoutProps) {
  const { isOpen, setIsOpen } = useGlobalSearch();
  const [cmdBarOpen, setCmdBarOpen] = useState(false);
  const [legacySearchOpen, setLegacySearchOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [deferredReady, setDeferredReady] = useState(false);

  // Intercepta ⌘K: abre a Command Bar global em vez do GlobalSearch direto.
  // GlobalSearch ainda fica acessível via "Buscar avançado" dentro do palette.
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
      setCmdBarOpen(true);
    }
  }, [isOpen, setIsOpen]);
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();

  useKeyboardShortcutsEnhanced();

  // Set user for logging
  useEffect(() => {
    setLogUser(user?.id || null);
  }, [user?.id]);

  // Track Request ID per route change for correlation
  useEffect(() => {
    const rid = generateRequestId();
    setRequestId(rid);
  }, [location.pathname]);

  // Defer heavy chrome until browser is idle to keep route transitions snappy
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    const schedule = w.requestIdleCallback
      ? (cb: () => void) => w.requestIdleCallback!(cb, { timeout: 2000 })
      : (cb: () => void) => window.setTimeout(cb, 800);
    const id = schedule(() => setDeferredReady(true));
    return () => {
      if (typeof id === 'number') window.clearTimeout(id);
    };
  }, []);

  const pageTitle = useMemo(() => title || getPageTitle(location.pathname), [title, location.pathname]);
  const breadcrumbs = useMemo(() => getBreadcrumbs(location.pathname, pageTitle), [location.pathname, pageTitle]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo!');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <SkipToContent />
      <RouteProgressBar />
      <SwipeBackIndicator />

      {/* Screen reader route announcer */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Navegou para {pageTitle}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile Header */}
      <MobileHeader onSearchClick={() => setIsOpen(true)} title={title} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header Bar — Premium Floating Navigation */}
        <header className="hidden md:flex h-16 items-center border-b border-border/30 px-6 bg-background/60 backdrop-blur-xl sticky top-0 z-30 transition-all duration-300" role="banner">
          {/* Left: sidebar trigger + breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-[200px] shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors shrink-0" aria-label="Alternar sidebar" />
            <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" aria-hidden="true" />}
                  {crumb.path ? (
                    <Link to={crumb.path} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          {/* Center: search bar + mic */}
          <div className="flex-1 flex items-center justify-center gap-3 pr-[15%] lg:pr-[25%]">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-3 rounded-2xl bg-secondary/5 border border-border/20 px-5 py-2.5 text-sm text-muted-foreground cursor-pointer hover:bg-secondary/10 hover:border-primary/20 hover:text-foreground hover:shadow-soft transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none w-full max-w-[520px] group"
              aria-label="Abrir busca inteligente (⌘K)"
            >
              <Search className="h-4 w-4 text-primary/60 shrink-0 group-hover:text-primary transition-colors" aria-hidden="true" />
              <span className="flex-1 text-left font-light tracking-tight">Buscar em todo o ecossistema...</span>
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded-md border border-border/40 bg-background/40 px-2 text-[10px] font-mono text-muted-foreground/60 shrink-0 uppercase tracking-tighter" aria-hidden="true">
                <Command className="h-2.5 w-2.5" /> K
              </kbd>
            </button>
            <button
              className="shrink-0 h-10 w-10 rounded-2xl border border-border/20 bg-secondary/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/10 hover:border-primary/20 hover:shadow-soft transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-label="Entrada por voz"
              onClick={() => setVoiceMode(true)}
            >
              <Mic className="h-4.5 w-4.5" />
            </button>
            <AIEmailComposerTrigger />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* User dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative h-8 w-8 rounded-full nexus-gradient-bg flex items-center justify-center text-xs font-semibold text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Menu do usuário"
                  >
                    {(user.email?.[0] || 'U').toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-nexus-emerald border-2 border-background" aria-label="Online" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-foreground">Minha conta</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                    <a href="/configuracoes">
                      <Settings className="h-3.5 w-3.5" /> Configurações
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-3.5 w-3.5" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-auto pb-24 md:pb-8 relative" tabIndex={-1} aria-label={pageTitle}>
          {/* Subtle radial depth */}
          <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.015]" style={{
            backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary)), transparent)',
          }} aria-hidden="true" />
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Components */}
      <GlobalCommandBar
        open={cmdBarOpen}
        onOpenChange={setCmdBarOpen}
        onOpenLegacySearch={() => setLegacySearchOpen(true)}
        onOpenAsk={() => window.dispatchEvent(new CustomEvent('open-ask-crm'))}
      />
      <GlobalSearch open={legacySearchOpen} onOpenChange={setLegacySearchOpen} voiceMode={voiceMode} onVoiceModeChange={setVoiceMode} />
      {/*
        Stack flutuante única: empilha ScrollToTopButton (topo) acima do
        QuickAddButton (base) com `gap-3`, garantindo que jamais se sobreponham
        — nem visualmente, nem quando o menu radial do QuickAdd abre para cima.
        Mobile usa `bottom-24` para folgar a MobileBottomNav (h-16) + safe-area;
        desktop usa `bottom-8`/`lg:bottom-10`. Ambos em `items-end` para
        alinhar à direita.
      */}
      <div
        className={cn(
          'fixed right-4 md:right-8 lg:right-10 z-50',
          'bottom-24 md:bottom-8 lg:bottom-10',
          'flex flex-col items-end gap-3',
        )}
      >
        <ScrollToTopButton className="relative" />
        <QuickAddButton className="relative z-10" />
      </div>

      <NotificationCenter />
      <SlowQueryIndicator />
      {deferredReady && (
        <Suspense fallback={null}>
          <OnboardingTourWrapper />
          <KeyboardShortcutsCheatsheet />
          <AskCrmChat />
          <AIEmailComposer />
        </Suspense>
      )}
    </div>
  );
}

const SIDEBAR_KEY = "nexus-sidebar-state";

function getDefaultOpen() {
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored !== "false";
  } catch {
    return true;
  }
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SidebarProvider
      defaultOpen={getDefaultOpen()}
      onOpenChange={(open) => {
        try { localStorage.setItem(SIDEBAR_KEY, String(open)); } catch { /* noop */ }
      }}
    >
      <AppLayoutInner title={title}>
        {children}
      </AppLayoutInner>
    </SidebarProvider>
  );
}
