import { forwardRef } from 'react';
import { Plus, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/navigation/BackButton';
import { UnifiedNotificationsBell } from '@/components/notifications/UnifiedNotificationsBell';
import { SmartNotificationsBell } from '@/components/notifications/SmartNotificationsBell';
import { GlobalDensityToggle } from '@/components/ui/global-density-toggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  backTo?: string;
  hideBack?: boolean;
}

const PARENT_ROUTES: Record<string, string> = {
  '/contatos': '/',
  '/empresas': '/',
  '/interacoes': '/',
  '/analytics': '/',
  '/insights': '/',
  '/calendario': '/',
  '/notificacoes': '/',
  '/network': '/',
  '/automacoes': '/',
  '/configuracoes': '/',
  '/mapa-empresas': '/',
};

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header({ 
  title, 
  subtitle,
  icon: PageIcon,
  showAddButton, 
  addButtonLabel, 
  onAddClick,
  backTo,
  hideBack = false,
}, ref) {
  const location = useLocation();
  const isRoot = location.pathname === '/';
  const showBack = !hideBack && !isRoot;
  const resolvedBackTo = backTo || PARENT_ROUTES[location.pathname] || '/';

  return (
    <header ref={ref} className="sticky top-0 z-30 border-b border-border/40 bg-[linear-gradient(180deg,hsl(var(--surface-1))/0.94_0%,hsl(var(--card))/0.88_100%)] backdrop-blur-md px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <BackButton
              to={resolvedBackTo}
              label="Voltar"
              variant="ghost"
              className="shrink-0 -ml-1 hidden md:inline-flex"
            />
          )}
          <div className="min-w-0 flex items-center gap-2">
            {PageIcon && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="hidden shrink-0 rounded-xl border border-primary/15 bg-primary/10 p-2 md:flex"
              >
                <PageIcon className="w-4 h-4 text-primary" aria-hidden="true" />
              </motion.div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-semibold text-foreground truncate leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground/80 truncate tabular-nums mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          <div className="hidden md:inline-flex items-center gap-1">
            <GlobalDensityToggle />
            <SmartNotificationsBell />
            <UnifiedNotificationsBell />
          </div>

          {/* Trigger ⌘K visível em mobile como ícone */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            aria-label="Buscar (⌘K)"
            onClick={() => {
              const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
              window.dispatchEvent(ev);
            }}
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </Button>

          {showAddButton && (
            <Button onClick={onAddClick} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs px-2 sm:px-3">
              <Plus className="w-3.5 h-3.5 sm:mr-1.5" aria-hidden="true" />
              <span className="hidden sm:inline">{addButtonLabel || 'Adicionar'}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
