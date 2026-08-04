import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Cake, Thermometer, Star, X, Clock, ChevronRight,
  MessageSquare, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SmartReminder } from '@/hooks/useSmartReminders';
import { cn } from '@/lib/utils';

const typeIcons = { 
  follow_up: Calendar, 
  birthday: Cake, 
  decay: Thermometer, 
  milestone: Star,
  nba_escalation: AlertTriangle
};
const typeColors = {
  follow_up: 'text-info bg-info/10', 
  birthday: 'text-warning bg-warning/10',
  decay: 'text-destructive bg-destructive/10', 
  milestone: 'text-success bg-success/10',
  nba_escalation: 'text-red-600 bg-red-100',
};
const priorityColors = {
  high: 'border-l-destructive bg-destructive/5', medium: 'border-l-warning bg-warning/5', low: 'border-l-success bg-success/5',
};
const priorityBadgeColors = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-success/10 text-success border-success/30',
};

interface ReminderCardProps {
  reminder: SmartReminder;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onComplete: (reminder: SmartReminder) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  onContactClick: (contactId: string) => void;
}

export function ReminderCard({
  reminder, index, isExpanded, onToggleExpand,
  onComplete, onDismiss, onSnooze, onContactClick,
}: ReminderCardProps) {
  const Icon = typeIcons[reminder.type];

  return (
    <motion.div
      key={reminder.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card
        className={cn('border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden', priorityColors[reminder.priority])}
        onClick={() => onToggleExpand(reminder.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg shrink-0', typeColors[reminder.type])}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm line-clamp-1">{reminder.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reminder.description}</p>
                </div>
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 shrink-0', priorityBadgeColors[reminder.priority])}>
                  {reminder.priority === 'high' ? 'Urgente' : reminder.priority === 'medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                      {reminder.dueDate && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(reminder.dueDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                      )}
                      {reminder.type === 'decay' && reminder.metadata && (
                        <div className="flex items-center gap-2 text-xs">
                          <Thermometer className="w-3 h-3 text-destructive" />
                          <span className="text-muted-foreground">{String(reminder.metadata.daysSinceLastInteraction)} dias sem contato</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">Score: {String(reminder.metadata.relationshipScore)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="default" className="h-7 text-xs bg-success hover:bg-success" onClick={(e) => { e.stopPropagation(); onComplete(reminder); }}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Concluir
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onContactClick(reminder.contactId); }}>
                          <MessageSquare className="w-3 h-3 mr-1" /> Ver Contato
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" className="h-7 text-xs"><Clock className="w-3 h-3 mr-1" /> Adiar</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onSnooze(reminder.id, 1)}>1 hora</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSnooze(reminder.id, 4)}>4 horas</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSnooze(reminder.id, 24)}>Amanhã</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDismiss(reminder.id); }}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isExpanded && (
                <div className="flex items-center justify-between mt-2">
                  <button onClick={(e) => { e.stopPropagation(); onContactClick(reminder.contactId); }} className="text-xs text-primary hover:underline flex items-center gap-1">
                    {reminder.contactName}<ChevronRight className="w-3 h-3" />
                  </button>
                  {reminder.dueDate && <span className="text-[10px] text-muted-foreground">{new Date(reminder.dueDate).toLocaleDateString('pt-BR')}</span>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
