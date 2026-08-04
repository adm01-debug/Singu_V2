/**
 * Catálogo de rotas e ações para a Command Bar global.
 * Mantido fora do componente para facilitar testes e reuso.
 */
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Building2, Users, Kanban, MessageSquare, CalendarDays,
  Share2, Activity, Lightbulb, BarChart3, Zap, BrainCircuit, LifeBuoy,
  Star, Mail, BookOpen, Workflow, Megaphone, FileText,
  MapPin, Globe, MapPinned, Target, Radar, Gauge, Sparkles, TrendingUp,
  Brain, LineChart, Heart, Briefcase, CheckSquare, ListFilter, Trophy,
  ArrowRightLeft, Copy, Package, Bell, Shield, Settings,
} from 'lucide-react';

export interface CommandRoute {
  id: string;
  label: string;
  url: string;
  icon: LucideIcon;
  section: 'CRM' | 'Inteligência' | 'Outbound' | 'Comunicação' | 'Admin' | 'Configuração';
  keywords?: string[];
}

export const COMMAND_ROUTES: CommandRoute[] = [
  // CRM
  { id: 'r-dashboard', label: 'Dashboard', url: '/', icon: LayoutDashboard, section: 'CRM' },
  { id: 'r-empresas', label: 'Empresas', url: '/empresas', icon: Building2, section: 'CRM' },
  { id: 'r-contatos', label: 'Contatos', url: '/contatos', icon: Users, section: 'CRM' },
  { id: 'r-pipeline', label: 'Pipeline', url: '/pipeline', icon: Kanban, section: 'CRM' },
  { id: 'r-interacoes', label: 'Conversas', url: '/interacoes', icon: MessageSquare, section: 'CRM' },
  { id: 'r-calendario', label: 'Calendário', url: '/calendario', icon: CalendarDays, section: 'CRM' },
  { id: 'r-tarefas', label: 'Tarefas', url: '/tarefas', icon: CheckSquare, section: 'CRM' },
  { id: 'r-inbox', label: 'Inbox', url: '/inbox', icon: MessageSquare, section: 'CRM', keywords: ['caixa', 'prioridades', 'follow-up'] },
  { id: 'r-deal-rooms', label: 'Deal Rooms', url: '/deal-rooms', icon: Briefcase, section: 'CRM' },
  // Inteligência
  { id: 'r-network', label: 'Network', url: '/network', icon: Share2, section: 'Inteligência' },
  { id: 'r-intelligence', label: 'Intelligence Hub', url: '/intelligence', icon: Activity, section: 'Inteligência', keywords: ['ia', 'ai', 'hub'] },
  { id: 'r-insights', label: 'Insights', url: '/insights', icon: Lightbulb, section: 'Inteligência' },
  { id: 'r-analytics', label: 'Analytics', url: '/analytics', icon: BarChart3, section: 'Inteligência' },
  { id: 'r-performance', label: 'Performance', url: '/performance', icon: Zap, section: 'Inteligência' },
  { id: 'r-bi', label: 'BI Avançado', url: '/bi', icon: BrainCircuit, section: 'Inteligência' },
  { id: 'r-forecasting', label: 'Forecasting', url: '/forecasting', icon: LineChart, section: 'Inteligência' },
  { id: 'r-conv-intel', label: 'Conversation Intelligence', url: '/conversation-intelligence', icon: Brain, section: 'Inteligência' },
  { id: 'r-win-loss', label: 'Win/Loss', url: '/win-loss', icon: TrendingUp, section: 'Inteligência' },
  { id: 'r-revops', label: 'RevOps', url: '/revops', icon: Activity, section: 'Inteligência' },
  { id: 'r-customer-success', label: 'Customer Success', url: '/customer-success', icon: Heart, section: 'Inteligência' },
  { id: 'r-lead-scoring', label: 'Lead Scoring', url: '/lead-scoring', icon: Gauge, section: 'Inteligência' },
  // Outbound
  { id: 'r-abm', label: 'ABM', url: '/abm', icon: Target, section: 'Outbound' },
  { id: 'r-intent', label: 'Intent Data', url: '/intent', icon: Radar, section: 'Outbound' },
  { id: 'r-territorios', label: 'Territórios', url: '/territorios', icon: Globe, section: 'Outbound' },
  { id: 'r-territory-opt', label: 'Otimização de Territórios', url: '/territory-optimization', icon: MapPinned, section: 'Outbound' },
  { id: 'r-mapa', label: 'Mapa de Empresas', url: '/mapa-empresas', icon: MapPin, section: 'Outbound' },
  { id: 'r-sequencias', label: 'Sequências', url: '/sequencias', icon: ListFilter, section: 'Outbound' },
  { id: 'r-rodizio', label: 'Rodízio', url: '/rodizio', icon: ArrowRightLeft, section: 'Outbound' },
  { id: 'r-enrichment', label: 'Enriquecimento', url: '/enrichment', icon: Sparkles, section: 'Outbound' },
  { id: 'r-metas', label: 'Metas & Gamificação', url: '/metas', icon: Trophy, section: 'Outbound' },
  // Comunicação
  { id: 'r-campanhas', label: 'Campanhas', url: '/campanhas', icon: Mail, section: 'Comunicação' },
  { id: 'r-sms', label: 'SMS Marketing', url: '/sms-marketing', icon: MessageSquare, section: 'Comunicação' },
  { id: 'r-marketing', label: 'Marketing Hub', url: '/marketing', icon: Megaphone, section: 'Comunicação' },
  { id: 'r-landing', label: 'Landing Pages', url: '/landing-pages', icon: FileText, section: 'Comunicação' },
  { id: 'r-nurturing', label: 'Nurturing', url: '/nurturing', icon: Workflow, section: 'Comunicação' },
  { id: 'r-knowledge', label: 'Knowledge Base', url: '/knowledge-base', icon: BookOpen, section: 'Comunicação' },
  { id: 'r-suporte', label: 'Suporte', url: '/suporte', icon: LifeBuoy, section: 'Comunicação' },
  { id: 'r-nps', label: 'NPS & Satisfação', url: '/nps', icon: Star, section: 'Comunicação' },
  // Admin
  { id: 'r-deduplicacao', label: 'Deduplicação', url: '/deduplicacao', icon: Copy, section: 'Admin' },
  { id: 'r-erp', label: 'ERP Viewer', url: '/erp', icon: Package, section: 'Admin' },
  { id: 'r-documentos', label: 'Documentos', url: '/documentos', icon: BookOpen, section: 'Admin' },
  { id: 'r-automacoes', label: 'Automações', url: '/automacoes', icon: Workflow, section: 'Admin' },
  { id: 'r-playbooks', label: 'Playbooks', url: '/playbooks', icon: BookOpen, section: 'Admin' },
  { id: 'r-report-builder', label: 'Report Builder', url: '/report-builder', icon: LayoutDashboard, section: 'Admin' },
  { id: 'r-relatorios', label: 'Relatórios Customizáveis', url: '/relatorios-customizaveis', icon: LayoutDashboard, section: 'Admin' },
  // Configuração
  { id: 'r-notificacoes', label: 'Notificações', url: '/notificacoes', icon: Bell, section: 'Configuração' },
  { id: 'r-seguranca', label: 'Segurança', url: '/seguranca', icon: Shield, section: 'Configuração' },
  { id: 'r-configuracoes', label: 'Configurações', url: '/configuracoes', icon: Settings, section: 'Configuração' },
];

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  /** Quando definido, dispara esse atalho de teclado. */
  shortcut?: string;
  /** Quando definido, executa essa função. */
  run?: () => void;
  /** Quando definido, dispara um evento customizado no window. */
  event?: string;
}

export const RECENT_KEY_PREFIX = 'singu-cmdk-recent-v1';
export const RECENT_LIMIT = 5;

function recentKey(userId?: string) {
  return `${RECENT_KEY_PREFIX}-${userId ?? 'anon'}`;
}

export function readRecent(userId?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(recentKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

export function pushRecent(id: string, userId?: string) {
  try {
    const key = recentKey(userId);
    const cur = readRecent(userId).filter((x) => x !== id);
    cur.unshift(id);
    window.localStorage.setItem(key, JSON.stringify(cur.slice(0, RECENT_LIMIT)));
  } catch {
    /* noop */
  }
}
