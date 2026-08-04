import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, Zap, ArrowLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MobileSidebarDrawer } from './MobileSidebarDrawer';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

/** Routes that are considered "detail" or "nested" — show back arrow instead of hamburger */
const NESTED_ROUTE_PATTERNS = [
  /^\/contatos\/.+/,
  /^\/empresas\/.+/,
  /^\/relatorio\/.+/,
];

/** Top-level sub-pages — show back arrow to go to dashboard */
const SUB_PAGES = [
  '/contatos',
  '/empresas',
  '/interacoes',
  '/analytics',
  '/insights',
  '/calendario',
  '/notificacoes',
  '/network',
  '/automacoes',
  '/configuracoes',
];

/** Route-to-title mapping */
const ROUTE_TITLES: Record<string, string> = {
  '/contatos': 'Contatos',
  '/empresas': 'Empresas',
  '/interacoes': 'Conversas',
  '/analytics': 'Analytics',
  '/insights': 'Insights',
  '/calendario': 'Calendário',
  '/notificacoes': 'Notificações',
  '/network': 'Network',
  '/automacoes': 'Automações',
  '/configuracoes': 'Configurações',
};

interface MobileHeaderProps {
  onSearchClick?: () => void;
  title?: string;
}

export function MobileHeader({ onSearchClick, title }: MobileHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { goBack } = useNavigationStack();

  const isRoot = location.pathname === '/';
  const isNested = NESTED_ROUTE_PATTERNS.some(p => p.test(location.pathname));
  const isSubPage = SUB_PAGES.includes(location.pathname);
  const showBackButton = !isRoot && (isNested || isSubPage);

  // Build micro-breadcrumb for nested pages
  const parentSegment = (() => {
    if (!isNested) return null;
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const parentPath = `/${segments[0]}`;
      const parentLabel = ROUTE_TITLES[parentPath];
      return parentLabel ? { path: parentPath, label: parentLabel } : null;
    }
    return null;
  })();

  // Resolve title: explicit prop > exact match > prefix match for detail pages
  const resolvedTitle = title || ROUTE_TITLES[location.pathname] || (() => {
    if (location.pathname.startsWith('/contatos/')) return 'Contato';
    if (location.pathname.startsWith('/empresas/')) return 'Empresa';
    if (location.pathname.startsWith('/relatorio/')) return 'Relatório';
    if (location.pathname.startsWith('/admin/')) return 'Admin';
    return undefined;
  })();

  const handleLeftAction = () => {
    if (showBackButton) {
      goBack();
    } else {
      setDrawerOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 md:hidden border-b border-border/40 bg-background/80 backdrop-blur-md safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Menu or Back */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLeftAction}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={showBackButton ? 'Voltar' : 'Abrir menu'}
          >
            {showBackButton ? (
              <ArrowLeft className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </motion.button>

          {/* Center: Logo, Title, or Micro-breadcrumb */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 min-w-0 flex-1 justify-center"
            >
              {parentSegment && resolvedTitle ? (
                <div className="flex items-center gap-1 min-w-0">
                  <Link
                    to={parentSegment.path}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {parentSegment.label}
                  </Link>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                  <h1 className="text-sm font-semibold text-foreground truncate">{resolvedTitle}</h1>
                </div>
              ) : resolvedTitle ? (
                <h1 className="text-base font-semibold text-foreground truncate">{resolvedTitle}</h1>
              ) : (
                <>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-nexus-cyan to-accent shadow-[0_14px_28px_-18px_hsl(var(--nexus-glow)/0.8)]">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-base text-foreground">SINGU</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSearchClick}
              className="p-2 rounded-xl hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/notificacoes')}
              className="p-2 rounded-xl hover:bg-muted transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </header>

      <MobileSidebarDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        onSearchClick={onSearchClick}
      />
    </>
  );
}
