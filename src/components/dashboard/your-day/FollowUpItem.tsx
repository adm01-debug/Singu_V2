import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Badge } from '@/components/ui/badge';
import { formatContactName, getContactInitials } from '@/lib/formatters';
import { Calendar, Phone, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const interactionTypeIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Calendar,
  email: MessageSquare,
  whatsapp: MessageSquare,
  note: MessageSquare,
};

interface FollowUpItemProps {
  interaction: {
    id: string;
    contact_id: string;
    type: string;
    title: string;
    follow_up_date?: string | null;
  };
  contact?: {
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  } | null;
  index: number;
  showUrgency?: boolean;
}

export function FollowUpItem({ interaction, contact, index, showUrgency = false }: FollowUpItemProps) {
  const Icon = interactionTypeIcons[interaction.type] || MessageSquare;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Link
        to={`/contatos/${interaction.contact_id}`}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 hover:translate-x-0.5 transition-all duration-200 group"
      >
        <OptimizedAvatar
          src={contact?.avatar_url || undefined}
          alt={`${contact?.first_name} ${contact?.last_name}`}
          fallback={getContactInitials(contact?.first_name, contact?.last_name)}
          size="sm"
          className="h-8 w-8"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">
            {formatContactName(contact?.first_name, contact?.last_name)}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Icon className="w-3 h-3 shrink-0" />
            {interaction.title}
          </p>
        </div>
        {showUrgency && interaction.follow_up_date && (() => {
          const followUpDate = parseISO(interaction.follow_up_date);
          const daysSince = Math.floor((Date.now() - followUpDate.getTime()) / (1000 * 60 * 60 * 24));
          const urgencyClass = daysSince > 60 ? 'border-destructive/60 text-destructive bg-destructive/15 animate-pulse'
            : daysSince > 30 ? 'border-destructive/50 text-destructive bg-destructive/10'
            : daysSince > 14 ? 'border-destructive/30 text-destructive'
            : 'border-warning/30 text-warning';
          const urgencyLabel = daysSince > 60 ? '🔴 ' : daysSince > 30 ? '⚠️ ' : '';
          return (
            <Badge variant="outline" className={cn("text-[10px] font-medium shrink-0 tabular-nums", urgencyClass)} title={format(followUpDate, 'dd/MM/yyyy')}>
              {urgencyLabel}{formatDistanceToNow(followUpDate, { addSuffix: true, locale: ptBR })}
            </Badge>
          );
        })()}
      </Link>
    </motion.div>
  );
}
