import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, X, Clock, ExternalLink, AlertOctagon, AlertTriangle, Info, Bell as BellIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SmartNotification, NotifUrgency } from '@/hooks/useSmartNotifications';

const URGENCY_STYLES: Record<NotifUrgency, { ring: string; icon: React.ReactNode; label: string }> = {
  critical: { ring: 'border-l-destructive', icon: <AlertOctagon className="w-4 h-4 text-destructive" />, label: 'Crítica' },
  high: { ring: 'border-l-warning', icon: <AlertTriangle className="w-4 h-4 text-warning" />, label: 'Alta' },
  normal: { ring: 'border-l-primary', icon: <Info className="w-4 h-4 text-primary" />, label: 'Normal' },
  low: { ring: 'border-l-muted-foreground/40', icon: <BellIcon className="w-4 h-4 text-muted-foreground" />, label: 'Baixa' },
};

interface Props {
  notif: SmartNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClick: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  onClose: () => void;
}

export const SmartNotificationItem = memo(function SmartNotificationItem({
  notif, onMarkRead, onDismiss, onClick, onSnooze, onClose,
}: Props) {
  const navigate = useNavigate();
  const style = URGENCY_STYLES[notif.urgency];
  const isUnread = notif.status === 'pending';

  const handleOpen = () => {
    onClick(notif.id);
    if (notif.action_url && notif.action_url.startsWith('/')) {
      onClose();
      navigate(notif.action_url);
    }
  };

  return (
    <div
      className={cn(
        'group rounded-md border-l-2 bg-card pl-3 pr-2 py-2 transition-colors hover:bg-accent/40',
        style.ring,
        isUnread && 'bg-accent/20',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">{style.icon}</div>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={handleOpen}
            className="w-full text-left"
          >
            <p className={cn('text-sm leading-snug truncate', isUnread && 'font-medium')}>
              {notif.title}
              {notif.bundle_count > 1 && (
                <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">×{notif.bundle_count}</span>
              )}
            </p>
            {notif.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.body}</p>}
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
              <span>{formatDistanceToNow(new Date(notif.created_at), { locale: ptBR, addSuffix: true })}</span>
              <span>•</span>
              <span>{style.label}</span>
              {notif.action_url && <ExternalLink className="w-3 h-3 ml-0.5" />}
            </div>
          </button>
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUnread && (
            <button
              type="button"
              title="Marcar como lida"
              onClick={() => onMarkRead(notif.id)}
              className="p-1 rounded hover:bg-muted"
            >
              <Check className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            title="Adiar 1h"
            onClick={() => onSnooze(notif.id, 1)}
            className="p-1 rounded hover:bg-muted"
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            title="Dispensar"
            onClick={() => onDismiss(notif.id)}
            className="p-1 rounded hover:bg-muted"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
});
