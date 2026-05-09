import { useState, useEffect, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Building2, 
  MessageSquare, 
  MoreHorizontal,
  BarChart3,
  Lightbulb,
  Calendar,
  Bell,
  Network,
  Settings,
  X,
  Workflow,
  Kanban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const mainNavItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Users, label: 'Contatos', path: '/contatos' },
  { icon: Building2, label: 'Empresas', path: '/empresas' },
  { icon: MessageSquare, label: 'Conversas', path: '/interacoes' },
];

const moreNavItems = [
  { icon: Kanban, label: 'Pipeline', path: '/pipeline' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Lightbulb, label: 'Insights', path: '/insights' },
  { icon: Calendar, label: 'Calendário', path: '/calendario' },
  { icon: Bell, label: 'Notificações', path: '/notificacoes' },
  { icon: Network, label: 'Network', path: '/network' },
  { icon: Workflow, label: 'Automações', path: '/automacoes' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

function MobileBottomNavInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const haptic = useHapticFeedback();

  // Auto-close "More" overlay on route change (e.g. swipe-back gesture)
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  // Notify ScrollToTopButton about overlay state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(showMore ? 'mobile-overlay-open' : 'mobile-overlay-close'));
  }, [showMore]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Check if active route is in "more" section for indicator
  const activeInMore = moreNavItems.some(item => isActive(item.path));

  const handleNavigate = (path: string) => {
    haptic.selection();
    navigate(path);
  };

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => {
                haptic.light();
                setShowMore(false);
              }}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-4 right-4 bg-card border border-border rounded-2xl p-4 z-50 md:hidden shadow-medium"
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  haptic.light();
                  setShowMore(false);
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Mais opções</h3>
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
                <button 
                  onClick={() => {
                    haptic.light();
                    setShowMore(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <motion.button
                      key={item.path}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-h-[var(--touch-target-min)]",
                        active 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden" role="navigation" aria-label="Menu principal">
        <div className="bg-card/80 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--background)/0.8)]">
          <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <motion.button
                  key={item.path}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNavigate(item.path)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                  className={cn(
                    "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px] min-h-[44px]",
                    active 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  {/* Active background indicator */}
                  {active && (
                    <motion.div
                      layoutId="mobileNavActiveBackground"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  
                  <div className="relative z-10 transition-transform duration-200" style={active ? { transform: 'scale(1.15)' } : undefined}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {/* Top indicator dot */}
                    {active && (
                      <motion.div
                        layoutId="mobileNavActiveIndicator"
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      />
                    )}
                  </div>
                  <span className={cn(
                    "relative z-10 text-[11px] font-medium transition-all",
                    active ? "opacity-100 font-semibold" : "opacity-70"
                  )}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
            
            {/* More Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                haptic.selection();
                setShowMore(!showMore);
              }}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px]",
                (showMore || activeInMore) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <MoreHorizontal className={cn("w-5 h-5 transition-transform", showMore && "rotate-90")} />
                {activeInMore && !showMore && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                )}
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-all",
                (showMore || activeInMore) ? "opacity-100" : "opacity-70"
              )}>
                Mais
              </span>
            </motion.button>
          </div>
        </div>
      </nav>
    </>
  );
}

// MobileBottomNav receives no props — memoizing prevents re-renders triggered by parent updates
export const MobileBottomNav = memo(MobileBottomNavInner);
