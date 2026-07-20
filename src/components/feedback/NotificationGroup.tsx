import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: Date | string;
  read?: boolean;
  entityId?: string;
  entityType?: string;
  priority?: 'low' | 'medium' | 'high';
  actions?: {
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }[];
}

interface NotificationGroupProps {
  type: string;
  label: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onClick?: (notification: NotificationItem) => void;
  maxVisible?: number;
}

/**
 * Groups similar notifications together with expand/collapse functionality
 */
export function NotificationGroup({
  type,
  label,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  notifications,
  onDismiss,
  onDismissAll,
  onClick,
  maxVisible = 3,
}: NotificationGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const count = notifications.length;
  
  if (count === 0) return null;
  
  const visibleNotifications = isExpanded 
    ? notifications 
    : notifications.slice(0, maxVisible);
  const hasMore = count > maxVisible;
  const hiddenCount = count - maxVisible;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Group Header */}
      <div 
        className={cn(
          "flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors",
          hasMore && "cursor-pointer"
        )}
        onClick={() => hasMore && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', iconBg)}>
            <Icon className={cn('w-4 h-4', iconColor)} />
          </div>
          <div>
            <span className="font-medium text-foreground">{label}</span>
            <span className="text-sm text-muted-foreground ml-2">
              ({count} {count === 1 ? 'item' : 'itens'})
            </span>
          </div>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-xs">
              {unreadCount} {unreadCount === 1 ? 'novo' : 'novos'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onDismissAll();
            }}
          >
            <Check className="w-3 h-3 mr-1" />
            Limpar todos
          </Button>
          {hasMore && (
            <Button variant="ghost" size="icon" aria-label="Subir" className="h-6 w-6">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Notifications List */}
      <AnimatePresence mode="popLayout">
        <div className="divide-y divide-border">
          {visibleNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={cn(
                "p-3 hover:bg-muted/30 cursor-pointer group transition-colors",
                !notification.read && "bg-primary/5"
              )}
              onClick={() => onClick?.(notification)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <p className={cn(
                      "text-sm truncate",
                      !notification.read ? "font-medium text-foreground" : "text-muted-foreground"
                    )}>
                      {notification.title}
                    </p>
                  </div>
                  {notification.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    {notification.priority === 'high' && (
                      <Badge variant="destructive" className="text-[10px] h-4">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {notification.actions.map((action, i) => (
                        <Button
                          key={i}
                          variant={action.variant || 'outline'}
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.action();
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 flex-shrink-0 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(notification.id);
                  }}
                  aria-label="Dispensar notificação"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
      
      {/* Show More Button */}
      {hasMore && !isExpanded && (
        <button
          className="w-full p-2 text-xs text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronDown className="w-3 h-3" />
          Ver mais {hiddenCount} {hiddenCount === 1 ? 'notificação' : 'notificações'}
        </button>
      )}
    </div>
  );
}

/**
 * Automatically groups notifications by type
 */
interface GroupedNotificationsProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onDismissAll: (type: string) => void;
  onClick?: (notification: NotificationItem) => void;
  groupConfig: Record<string, {
    label: string;
    icon: React.ElementType;
    iconColor?: string;
    iconBg?: string;
  }>;
}

export function GroupedNotifications({
  notifications,
  onDismiss,
  onDismissAll,
  onClick,
  groupConfig,
}: GroupedNotificationsProps) {
  // Group notifications by type
  const grouped = notifications.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(notification);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  const sortedTypes = Object.keys(grouped).sort((a, b) => {
    const aUnread = grouped[a].filter(n => !n.read).length;
    const bUnread = grouped[b].filter(n => !n.read).length;
    return bUnread - aUnread;
  });

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Nenhuma notificação</p>
        <p className="text-xs mt-1">Você está em dia!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTypes.map(type => {
        const config = groupConfig[type];
        const finalConfig = config || { label: type, icon: Bell };
        
        return (
          <NotificationGroup
            key={type}
            type={type}
            label={finalConfig.label}
            icon={finalConfig.icon}
            iconColor={'iconColor' in finalConfig ? finalConfig.iconColor : undefined}
            iconBg={'iconBg' in finalConfig ? finalConfig.iconBg : undefined}
            notifications={grouped[type]}
            onDismiss={onDismiss}
            onDismissAll={() => onDismissAll(type)}
            onClick={onClick}
          />
        );
      })}
    </div>
  );
}

export default NotificationGroup;
