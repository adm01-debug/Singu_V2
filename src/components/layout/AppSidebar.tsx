import { useLocation, Link } from "react-router-dom";
import { usePrefetch } from "@/components/navigation/PrefetchLink";
import {
  LayoutDashboard, Building2, Users, MessageSquare, Lightbulb, Settings,
  Zap, LogOut, CalendarDays, Bell, ChevronDown, BarChart3, Share2,
  Workflow, MapPin, PanelLeftClose, PanelLeft, Kanban, Trophy, CheckSquare, Globe, ArrowRightLeft, ListFilter, BrainCircuit, LifeBuoy, Mail, BookOpen, Copy, Package, Shield, Star, FileText, MapPinned, Target, Radar, Gauge, TrendingUp, Brain, LineChart, Briefcase, Megaphone, Activity, Heart, Sparkles,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navSections = [
  {
    label: "Principal",
    key: "principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Empresas", url: "/empresas", icon: Building2 },
      { title: "Contatos", url: "/contatos", icon: Users },
      { title: "Pipeline", url: "/pipeline", icon: Kanban },
      { title: "Conversas", url: "/interacoes", icon: MessageSquare },
      { title: "Calendário", url: "/calendario", icon: CalendarDays },
    ],
  },
  {
    label: "Análise",
    key: "analise",
    items: [
      { title: "Network", url: "/network", icon: Share2 },
      { title: "Intelligence", url: "/intelligence", icon: Activity },
      { title: "Insights", url: "/insights", icon: Lightbulb },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Performance", url: "/performance", icon: Zap },
      { title: "BI Avançado", url: "/bi", icon: BrainCircuit },
      { title: "Suporte", url: "/suporte", icon: LifeBuoy },
      { title: "NPS & Satisfação", url: "/nps", icon: Star },
      { title: "Report Builder", url: "/report-builder", icon: LayoutDashboard },
      { title: "Relatórios Customizáveis", url: "/relatorios-customizaveis", icon: LayoutDashboard },
      { title: "Assistente IA", url: "/assistente", icon: LayoutDashboard },
      { title: "Campanhas", url: "/campanhas", icon: Mail },
      { title: "SMS Marketing", url: "/sms-marketing", icon: MessageSquare },
      { title: "Knowledge Base", url: "/knowledge-base", icon: BookOpen },
      { title: "Nurturing", url: "/nurturing", icon: Workflow },
      { title: "Marketing", url: "/marketing", icon: Megaphone },
      { title: "Landing Pages", url: "/landing-pages", icon: FileText },
    ],
  },
  {
    label: "Operacional",
    key: "ops",
    items: [
      { title: "Mapa", url: "/mapa-empresas", icon: MapPin },
      { title: "Territórios", url: "/territorios", icon: Globe },
      { title: "Otimização Territórios", url: "/territory-optimization", icon: MapPinned },
      { title: "ABM", url: "/abm", icon: Target },
      { title: "Intent Data", url: "/intent", icon: Radar },
      { title: "Lead Scoring", url: "/lead-scoring", icon: Gauge },
      { title: "Enriquecimento", url: "/enrichment", icon: Sparkles },
      { title: "Win/Loss", url: "/win-loss", icon: TrendingUp },
      { title: "Conversation Intel", url: "/conversation-intelligence", icon: Brain },
      { title: "Playbooks", url: "/playbooks", icon: BookOpen },
      { title: "Forecasting", url: "/forecasting", icon: LineChart },
      { title: "RevOps", url: "/revops", icon: Activity },
      { title: "Customer Success", url: "/customer-success", icon: Heart },
      { title: "Deal Rooms", url: "/deal-rooms", icon: Briefcase },
      { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
      { title: "Automações", url: "/automacoes", icon: Workflow },
      { title: "Sequências", url: "/sequencias", icon: ListFilter },
      { title: "Metas", url: "/metas", icon: Trophy },
      { title: "Rodízio", url: "/rodizio", icon: ArrowRightLeft },
      { title: "Deduplicação", url: "/deduplicacao", icon: Copy },
      { title: "ERP", url: "/erp", icon: Package },
      { title: "Documentos", url: "/documentos", icon: BookOpen },
    ],
  },
  {
    label: "Configuração",
    key: "config",
    items: [
      { title: "Notificações", url: "/notificacoes", icon: Bell },
      { title: "Segurança", url: "/seguranca", icon: Shield },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ],
  },
];

const COLLAPSED_KEY = "nexus-sidebar-sections";

function getInitialCollapsed(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* noop */ }
  return { principal: false, analise: false, ops: true, config: true };
}

function AppSidebarInner() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { prefetch } = usePrefetch();
  const { user, signOut } = useAuth();
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<string, boolean>>(getInitialCollapsed);

  useEffect(() => {
    setSectionCollapsed(prev => {
      for (const section of navSections) {
        const hasActive = section.items.some(item =>
          item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
        );
        if (hasActive && prev[section.key]) {
          const next = { ...prev, [section.key]: false };
          try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); } catch { /* noop */ }
          return next;
        }
      }
      return prev;
    });
  }, [location.pathname]);

  const toggleSection = useCallback((key: string) => {
    setSectionCollapsed(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo!');
  };

  const userInitials = useMemo(() => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${(user.user_metadata.first_name as string)[0]}${(user.user_metadata.last_name as string)[0]}`;
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  }, [user?.user_metadata?.first_name, user?.user_metadata?.last_name, user?.email]);

  const userName = useMemo(() => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name as string;
    const emailPrefix = user?.email?.split('@')[0] || 'Usuário';
    const cleaned = emailPrefix.replace(/[0-9_\-.]+/g, ' ').trim();
    if (!cleaned || cleaned.length < 4) return 'Minha Conta';
    return cleaned.split(/\s+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }, [user?.user_metadata?.first_name, user?.user_metadata?.last_name, user?.user_metadata?.full_name, user?.email]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border" aria-label="Navegação principal">
      {/* ─── Header ─── */}
      <SidebarHeader className="p-3">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-heading text-sm font-bold tracking-tight text-foreground">
              SINGU
            </span>
          )}
        </Link>
      </SidebarHeader>

      {/* ─── Navigation ─── */}
      <SidebarContent className="px-2" role="navigation" aria-label="Menu principal">
        {navSections.map((section, sectionIdx) => {
          const isCollapsedSection = sectionCollapsed[section.key] && !collapsed;
          return (
            <SidebarGroup key={section.key}>
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex items-center justify-between w-full px-2 mb-0.5 group/label hover:bg-muted/50 rounded-md py-1 transition-colors"
                  aria-expanded={!isCollapsedSection}
                  aria-controls={`nav-section-${section.key}`}
                >
                  <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 pointer-events-none p-0 h-auto font-medium">
                    {section.label}
                  </SidebarGroupLabel>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-muted-foreground/30 transition-transform duration-200",
                      isCollapsedSection && "-rotate-90"
                    )}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                sectionIdx > 0 && <Separator className="my-1.5 mx-auto w-5 bg-border/50" />
              )}
              <SidebarGroupContent
                id={`nav-section-${section.key}`}
                className={cn(
                  "transition-all duration-200 overflow-hidden",
                  isCollapsedSection && !collapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
                )}
              >
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = item.url === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.url} className="relative">
                        {/* Discord-style active indicator bar */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary transition-all duration-200"
                            aria-hidden="true"
                          />
                        )}
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={cn(
                            "rounded-md transition-all duration-150 h-9 ml-0.5",
                            isActive
                              ? "text-foreground font-medium bg-primary/10 dark:bg-primary/8"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <Link to={item.url} aria-current={isActive ? "page" : undefined} onMouseEnter={() => prefetch(item.url)}>
                            <item.icon className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive ? "text-primary" : ""
                            )} />
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* ─── Footer ─── */}
      <SidebarFooter className="p-2 space-y-1">
        {!collapsed && (
          <>
            <Separator className="bg-border/50" />
            {user && (
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                  aria-label="Sair da conta"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="px-2 pt-0.5">
              <p className="text-[10px] text-muted-foreground/40 select-none">SINGU v2.0</p>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-start gap-2 text-muted-foreground/50 hover:text-foreground text-xs h-8"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

// Memoized — sidebar receives no props, safe to memoize the entire tree to avoid
// re-renders triggered by AppLayout updates on every route change.
export const AppSidebar = memo(AppSidebarInner);
