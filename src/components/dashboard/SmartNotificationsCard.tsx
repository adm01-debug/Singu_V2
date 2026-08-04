import { Bell, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';

const URGENCY_TONE: Record<string, string> = {
  critical: 'text-destructive border-destructive/40',
  high: 'text-warning border-warning/40',
  normal: 'text-primary border-primary/40',
  low: 'text-muted-foreground border-muted-foreground/30',
};

export function SmartNotificationsCard() {
  const navigate = useNavigate();
  const { items, isLoading, click } = useSmartNotifications();
  const top = items.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Notificações smart
        </CardTitle>
        {items.length > 0 && <Badge variant="outline" className="text-[10px]">{items.length} ativas</Badge>}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {isLoading && <p className="text-xs text-muted-foreground py-4 text-center">Carregando...</p>}
        {!isLoading && top.length === 0 && (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Nada urgente agora. ✨
          </p>
        )}
        {top.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              click(n.id);
              if (n.action_url) navigate(n.action_url);
            }}
            className={`w-full text-left px-2.5 py-2 rounded-md border bg-background hover:bg-accent/40 transition-colors ${URGENCY_TONE[n.urgency] ?? URGENCY_TONE.normal}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate text-foreground">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.body}</p>}
              </div>
              <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
