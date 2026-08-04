import { Zap, Clock, Command, ArrowRight, Users, Building2, MessageSquare, ExternalLink, Search } from 'lucide-react';
import { CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: typeof Zap;
  shortcut: string;
  color: string;
  path: string;
}

interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: typeof Zap;
  description: string;
}

interface RecentItem {
  id: string;
  type: 'contact' | 'company' | 'interaction' | 'page';
  title: string;
  path: string;
  timestamp: number;
}

interface Props {
  query: string;
  filteredQuickActions: QuickAction[];
  filteredNavigation: NavItem[];
  filteredRecent: RecentItem[];
  onQuickAction: (action: QuickAction) => void;
  onNavigate: (path: string, label: string) => void;
  onRecentSelect: (item: RecentItem) => void;
}

function getColorClass(color: string) {
  switch (color) {
    case 'primary': return 'bg-primary/10 text-primary';
    case 'accent': return 'bg-accent/10 text-accent';
    case 'warning': return 'bg-warning/10 text-warning';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'contact': return <Users className="w-4 h-4" />;
    case 'company': return <Building2 className="w-4 h-4" />;
    case 'interaction': return <MessageSquare className="w-4 h-4" />;
    case 'page': return <ExternalLink className="w-4 h-4" />;
    default: return <Search className="w-4 h-4" />;
  }
}

export function SearchLocalGroups({ query, filteredQuickActions, filteredNavigation, filteredRecent, onQuickAction, onNavigate, onRecentSelect }: Props) {
  const location = useLocation();

  return (
    <>
      {(!query || filteredQuickActions.length > 0) && (
        <CommandGroup heading={<div className="flex items-center gap-2"><Zap className="w-3 h-3" /><span>Ações Rápidas</span></div>}>
          {filteredQuickActions.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem key={action.id} onSelect={() => onQuickAction(action)} className="gap-3 py-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${getColorClass(action.color)}`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1"><p className="font-medium">{action.label}</p><p className="text-xs text-muted-foreground">{action.description}</p></div>
                <CommandShortcut>Alt+{action.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
      )}

      {filteredRecent.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading={<div className="flex items-center gap-2"><Clock className="w-3 h-3" /><span>Recentes</span></div>}>
            {filteredRecent.map((item, index) => (
              <CommandItem key={`${item.type}-${item.id}-${index}`} onSelect={() => onRecentSelect(item)} className="gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">{getTypeIcon(item.type)}</div>
                <div className="flex-1"><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground capitalize">{item.type === 'page' ? 'Página' : item.type}</p></div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}

      {(!query || filteredNavigation.length > 0) && (
        <>
          <CommandSeparator />
          <CommandGroup heading={<div className="flex items-center gap-2"><Command className="w-3 h-3" /><span>Navegação</span></div>}>
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <CommandItem key={item.path} onSelect={() => onNavigate(item.path, item.label)} className={`gap-3 ${isActive ? 'bg-primary/5' : ''}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1"><p className={`font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</p><p className="text-xs text-muted-foreground">{item.description}</p></div>
                  {isActive && <Badge variant="secondary" className="text-[10px]">Atual</Badge>}
                  <CommandShortcut>Alt+{item.key}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </>
      )}
    </>
  );
}
