import { motion } from 'framer-motion';
import { Cake, FileText, Heart, Award, Gift, Star, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ImportantDate } from '@/hooks/useImportantDates';

// eslint-disable-next-line react-refresh/only-export-components
export function getEventColor(type: ImportantDate['type']) {
  switch (type) {
    case 'birthday': return 'bg-primary';
    case 'contract_renewal': return 'bg-info';
    case 'anniversary': return 'bg-destructive';
    case 'milestone': return 'bg-warning';
    case 'first_purchase': return 'bg-success';
    default: return 'bg-secondary';
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function getEventIcon(type: ImportantDate['type']) {
  switch (type) {
    case 'birthday': return <Cake className="h-3 w-3" />;
    case 'contract_renewal': return <FileText className="h-3 w-3" />;
    case 'anniversary': return <Heart className="h-3 w-3" />;
    case 'milestone': return <Award className="h-3 w-3" />;
    case 'first_purchase': return <Star className="h-3 w-3" />;
    default: return <Gift className="h-3 w-3" />;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function getUrgencyColor(urgency: ImportantDate['urgency']) {
  switch (urgency) {
    case 'overdue': return 'text-destructive';
    case 'today': return 'text-success';
    case 'urgent': return 'text-warning';
    default: return 'text-muted-foreground';
  }
}

function getCardEventColor(type: ImportantDate['type']) {
  switch (type) {
    case 'birthday': return 'border-primary/30 bg-primary/5';
    case 'contract_renewal': return 'border-info/30 bg-info/5';
    case 'anniversary': return 'border-destructive/30 bg-destructive/5';
    case 'milestone': return 'border-warning/30 bg-warning/5';
    default: return 'border-secondary/30 bg-secondary/5';
  }
}

function getCardEventIcon(type: ImportantDate['type']) {
  switch (type) {
    case 'birthday': return <Cake className="h-4 w-4 text-primary" />;
    case 'contract_renewal': return <FileText className="h-4 w-4 text-info" />;
    case 'anniversary': return <Heart className="h-4 w-4 text-destructive" />;
    case 'milestone': return <Award className="h-4 w-4 text-warning" />;
    default: return <Gift className="h-4 w-4 text-secondary" />;
  }
}

interface EventCardProps {
  event: ImportantDate;
  showDate?: boolean;
  onNavigate: () => void;
}

export function EventCard({ event, showDate = false, onNavigate }: EventCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-3 rounded-lg border cursor-pointer transition-shadow hover:shadow-sm ${getCardEventColor(event.type)}`}
      onClick={onNavigate}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="mt-0.5">{getCardEventIcon(event.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground truncate">{event.contactName}</p>
            {showDate && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(event.date, "d 'de' MMMM", { locale: ptBR })}
                {event.daysUntil === 0 && (
                  <Badge variant="default" className="ml-2 text-[10px] px-1">Hoje</Badge>
                )}
                {event.daysUntil > 0 && event.daysUntil <= 7 && (
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1">Em {event.daysUntil}d</Badge>
                )}
              </p>
            )}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </motion.div>
  );
}
