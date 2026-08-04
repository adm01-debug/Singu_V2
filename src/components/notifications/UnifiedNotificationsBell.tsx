import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, TrendingDown, Star, CheckSquare, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUnifiedNotifications, type UnifiedNotification } from '@/hooks/useUnifiedNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SOURCE_META: Record<UnifiedNotification['source'], { label: string; icon: React.ElementType }> = {
  alert: { label: 'Alerta', icon: AlertTriangle },
  churn: { label: 'Churn', icon: TrendingDown },
  nps:   { label: 'NPS',   icon: Star },
  task:  { label: 'Tarefa', icon: CheckSquare },
};

const PRIORITY_STYLES: Record<UnifiedNotification['priority'], string> = {
  critical: 'text-destructive border-destructive/30 bg-destructive/5',
  high:     'text-warning border-warning/30 bg-warning/5',
  medium:   'text-primary border-primary/30 bg-primary/5',
  low:      'text-muted-foreground border-border bg-muted/30',
};

export function UnifiedNotificationsBell() {
  const { items, count, criticalCount, isLoading } = useUnifiedNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={`Notificações (${count})`}
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          {count > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                criticalCount > 0
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Central de notificações</h3>
            <p className="text-[11px] text-muted-foreground">
              {count === 0 ? 'Tudo em dia' : `${count} item(ns) — ${criticalCount} prioritário(s)`}
            </p>
          </div>
          <Link to="/notificacoes" className="text-xs text-primary hover:underline">
            Ver tudo
          </Link>
        </div>
        <Separator />
        <ScrollArea className="max-h-[420px]">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Carregando…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground mt-0.5">Você está em dia!</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {items.slice(0, 30).map((n) => {
                const meta = SOURCE_META[n.source];
                const Icon = meta.icon;
                return (
                  <li key={n.id}>
                    <Link
                      to={n.href}
                      className="flex gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${PRIORITY_STYLES[n.priority]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wide px-1.5 py-0 h-4">
                            {meta.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs font-medium truncate">{n.title}</p>
                        {n.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {n.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
