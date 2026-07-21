import { Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Building2, 
  MessageSquare, 
  BarChart3,
  Lightbulb,
  Calendar,
  Bell,
  Network,
  Settings,
  X,
  Search,
  LogOut,
  User,
  Zap,
  Workflow,
  MapPin,
  Trophy,
  Activity,
  Shield,
  BrainCircuit,
  LifeBuoy,
  Star,
  Globe,
  Target,
  Gauge,
  Sparkles,
  Brain,
  BookOpen,
  Kanban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  onSearchClick?: () => void;
}

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/', section: 'Principal' },
  { icon: Building2, label: 'Empresas', path: '/empresas', section: 'Principal' },
  { icon: Users, label: 'Contatos', path: '/contatos', section: 'Principal' },
  { icon: Kanban, label: 'Pipeline', path: '/pipeline', section: 'Principal' },
  { icon: MessageSquare, label: 'Conversas', path: '/interacoes', section: 'Principal' },
  { icon: Calendar, label: 'Calendário', path: '/calendario', section: 'Principal' },

  { icon: Network, label: 'Network', path: '/network', section: 'Análise' },
  { icon: Activity, label: 'Intelligence', path: '/intelligence', section: 'Análise' },
  { icon: Shield, label: 'Auditoria IA', path: '/intelligence/auditoria', section: 'Análise' },
  { icon: Lightbulb, label: 'Insights', path: '/insights', section: 'Análise' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', section: 'Análise' },
  { icon: Zap, label: 'Performance', path: '/performance', section: 'Análise' },
  { icon: BrainCircuit, label: 'BI Avançado', path: '/bi', section: 'Análise' },
  { icon: LifeBuoy, label: 'Suporte', path: '/suporte', section: 'Análise' },
  { icon: Star, label: 'NPS & Satisfação', path: '/nps', section: 'Análise' },

  { icon: MapPin, label: 'Mapa', path: '/mapa-empresas', section: 'Operacional' },
  { icon: Globe, label: 'Territórios', path: '/territorios', section: 'Operacional' },
  { icon: Target, label: 'ABM', path: '/abm', section: 'Operacional' },
  { icon: Gauge, label: 'Lead Scoring', path: '/lead-scoring', section: 'Operacional' },
  { icon: Sparkles, label: 'Enriquecimento', path: '/enrichment', section: 'Operacional' },
  { icon: Brain, label: 'Conversation Intel', path: '/conversation-intelligence', section: 'Operacional' },
  { icon: Workflow, label: 'Automações', path: '/automacoes', section: 'Operacional' },
  { icon: Trophy, label: 'Metas', path: '/metas', section: 'Operacional' },
  { icon: BookOpen, label: 'Documentos', path: '/documentos', section: 'Operacional' },

  { icon: Bell, label: 'Notificações', path: '/notificacoes', section: 'Configuração' },
  { icon: Shield, label: 'Segurança', path: '/seguranca', section: 'Configuração' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', section: 'Configuração' },
];

export function MobileSidebarDrawer({ open, onClose, onSearchClick }: MobileSidebarDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSearch = () => {
    onSearchClick?.();
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  // Group items by section
  const sections = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 flex w-[280px] flex-col bg-sidebar-background shadow-[20px_0_60px_-28px_hsl(var(--foreground)/0.85)] md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-nexus-cyan to-accent shadow-[0_18px_32px_-16px_hsl(var(--nexus-glow)/0.85)]">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg text-sidebar-accent-foreground">SINGU</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                aria-label="Fechar menu lateral"
              >
                <X className="w-5 h-5 text-sidebar-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4">
              <button
                onClick={handleSearch}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-sidebar-border/70 bg-[linear-gradient(135deg,hsl(var(--sidebar-accent))_0%,hsl(var(--sidebar-background))_100%)] text-sidebar-foreground/76 hover:bg-sidebar-accent transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Buscar...</span>
                <kbd className="ml-auto text-xs bg-sidebar-accent px-2 py-0.5 rounded">⌘K</kbd>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {Object.entries(sections).map(([section, items]) => (
                <Fragment key={section}>
                  <div className="px-3 py-2 mt-4 first:mt-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                      {section}
                    </span>
                  </div>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <motion.button
                        key={item.path}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigate(item.path)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all",
                          active 
                            ? "bg-[linear-gradient(135deg,hsl(var(--primary)/0.4),hsl(var(--accent)/0.22))] border border-primary/40 text-sidebar-primary-foreground shadow-[0_22px_44px_-24px_hsl(var(--primary)/0.62)]" 
                            : "border border-transparent text-sidebar-foreground/76 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-primary/15"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </Fragment>
              ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
