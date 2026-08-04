import { memo } from 'react';
import { Bell, AlertTriangle, Lightbulb, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNavigate } from 'react-router-dom';
import { AnimatedBadge } from '@/components/micro-interactions';
import { GroupedNotifications, type NotificationItem } from '@/components/feedback/NotificationGroup';
import { useMotionSafe } from '@/hooks/useReducedMotion';

const groupConfig = {
  alert: {
    label: 'Alertas',
    icon: AlertTriangle,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  insight: {
    label: 'Insights',
    icon: Lightbulb,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  health_alert: {
    label: 'Saúde do Relacionamento',
    icon: Heart,
    iconColor: 'text-destructive',
    iconBg: 'bg-destructive/10',
  },
  interaction: {
    label: 'Interações',
    icon: Clock,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  contact: {
    label: 'Contatos',
    icon: Bell,
    iconColor: 'text-muted-foreground',
    iconBg: 'bg-muted',
  },
};

function NotificationCenterInner() {
  const navigate = useNavigate();
  const { notifications, unreadCount, clearUnread, dismissNotification } = useRealtimeNotifications();
  useMotionSafe();

  // Map realtime notifications to NotificationItem format
  const groupedItems: NotificationItem[] = notifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    description: n.description,
    createdAt: n.createdAt,
    read: false,
    entityId: n.entityId,
    entityType: n.entityType,
  }));

  const handleNotificationClick = (notification: NotificationItem) => {
    if (notification.entityId && notification.entityType === 'contact') {
      navigate(`/contatos/${notification.entityId}`);
    }
    const original = notifications.find(n => n.id === notification.id);
    if (original) dismissNotification(original);
  };

  const handleDismiss = (id: string) => {
    const original = notifications.find(n => n.id === id);
    if (original) dismissNotification(original);
  };

  const handleDismissAllByType = (type: string) => {
    notifications
      .filter(n => n.type === type)
      .forEach(n => dismissNotification(n));
  };

  return (
    <Popover onOpenChange={(open) => open && clearUnread()}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label={unreadCount > 0 ? `Notificações: ${unreadCount} não lidas` : 'Notificações'}
        >
          <Bell className="h-5 w-5" />
          <AnimatedBadge 
            count={unreadCount} 
            className="absolute -top-1 -right-1"
            variant="destructive"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        role="region"
        aria-label="Centro de notificações"
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notificações</h3>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => navigate('/notificacoes')}
              >
                Ver todas
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-[450px]">
          <div className="p-3">
            <GroupedNotifications
              notifications={groupedItems}
              onDismiss={handleDismiss}
              onDismissAll={handleDismissAllByType}
              onClick={handleNotificationClick}
              groupConfig={groupConfig}
            />
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// NotificationCenter receives no props — memoize to skip re-renders when AppLayout updates
export const NotificationCenter = memo(NotificationCenterInner);
export default NotificationCenter;
