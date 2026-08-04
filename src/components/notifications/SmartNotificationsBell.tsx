import { useState } from 'react';
import { Bell, CheckCheck, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { SmartNotificationItem } from './SmartNotificationItem';

export function SmartNotificationsBell() {
  const [open, setOpen] = useState(false);
  const { items, unreadCount, isLoading, markRead, dismiss, click, snooze, markAllRead } = useSmartNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notificações inteligentes"
          className="relative p-2 rounded-md hover:bg-accent transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] rounded-full flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Notificações</span>
            {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} novas</Badge>}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                title="Marcar todas como lidas"
                className="p-1.5 rounded hover:bg-accent text-muted-foreground"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <Link
              to="/notificacoes/configuracoes"
              onClick={() => setOpen(false)}
              title="Configurações"
              className="p-1.5 rounded hover:bg-accent text-muted-foreground"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <ScrollArea className="max-h-[420px]">
          <div className="p-2 space-y-1.5">
            {isLoading && (
              <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>
            )}
            {!isLoading && items.length === 0 && (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto opacity-30 mb-2" />
                Nenhuma notificação no momento.
              </div>
            )}
            {items.map((n) => (
              <SmartNotificationItem
                key={n.id}
                notif={n}
                onMarkRead={markRead}
                onDismiss={dismiss}
                onClick={click}
                onSnooze={snooze}
                onClose={() => setOpen(false)}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
