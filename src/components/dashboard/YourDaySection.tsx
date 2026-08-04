import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatContactName, toTitleCase, getContactInitials } from '@/lib/formatters';
import { 
  Calendar, 
  Cake, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useYourDay } from '@/hooks/useYourDay';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const interactionTypeIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Calendar,
  email: MessageSquare,
  whatsapp: MessageSquare,
  note: MessageSquare,
};

const skeletonLabels = ['Carregando follow-ups...', 'Carregando aniversários...', 'Carregando alertas...'];

const YourDaySkeleton = () => (
  <div className="space-y-3" role="status" aria-label="Carregando seu dia">
    {skeletonLabels.map((label, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    ))}
  </div>
);

interface SectionHeaderProps {
  icon: React.ElementType;
  label: string;
  count: number;
  colorClass: string;
}

function SectionHeader({ icon: Icon, label, count, colorClass }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={cn('w-1.5 h-1.5 rounded-full', colorClass)} />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className={cn('text-xs font-bold', colorClass.replace('bg-', 'text-'))}>
        {count}
      </span>
    </div>
  );
}

interface YourDaySectionProps {
  className?: string;
}

export function YourDaySection({ className }: YourDaySectionProps) {
  const {
    todayFollowUps,
    overdueFollowUps,
    upcomingBirthdays,
    needsAttention,
    newInsights,
    loading,
  } = useYourDay();

  const totalTasks = todayFollowUps.length + overdueFollowUps.length;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <YourDaySkeleton />
      </motion.div>
    );
  }

  const hasAnyData = 
    todayFollowUps.length > 0 || 
    overdueFollowUps.length > 0 || 
    upcomingBirthdays.length > 0 || 
    needsAttention.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Seu dia
          </h2>
          {totalTasks > 0 && (
            <span className="text-xs text-muted-foreground" aria-label={`${totalTasks} tarefa${totalTasks !== 1 ? 's' : ''} pendente${totalTasks !== 1 ? 's' : ''}`}>
              · {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Link to="/calendario">
          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground">
            <Calendar className="w-3.5 h-3.5" />
            Calendário
          </Button>
        </Link>
      </div>

      {/* No data state */}
      {!hasAnyData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-xl border border-dashed border-success/20 bg-success/5 py-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-success/60" />
          </motion.div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Tudo em dia! 🎉</h3>
          <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
            Nenhuma tarefa urgente ou follow-up pendente. Aproveite para fortalecer seus relacionamentos.
          </p>
          <Link to="/contatos" className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-primary hover:underline">
            Ver contatos
            <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>
      )}

      {/* Unified list layout */}
      {hasAnyData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Left Column */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-4 border-l-2 border-l-destructive/40 flex flex-col">
            {/* Overdue Follow-ups */}
            {overdueFollowUps.length > 0 && (
              <div>
                <SectionHeader icon={AlertCircle} label="Atrasados" count={overdueFollowUps.length} colorClass="bg-destructive" />
                <div className="space-y-1">
                  {overdueFollowUps.slice(0, 4).map((item, idx) => {
                    const Icon = interactionTypeIcons[item.interaction.type] || MessageSquare;
                    return (
                      <motion.div
                        key={item.interaction.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <Link
                          to={`/contatos/${item.interaction.contact_id}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 hover:translate-x-0.5 transition-all duration-200 group"
                        >
                          <OptimizedAvatar 
                            src={item.contact?.avatar_url || undefined}
                            alt={`${item.contact?.first_name} ${item.contact?.last_name}`}
                            fallback={getContactInitials(item.contact?.first_name, item.contact?.last_name)}
                            size="sm"
                            className="h-8 w-8"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">
                              {formatContactName(item.contact?.first_name, item.contact?.last_name)}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Icon className="w-3 h-3 shrink-0" />
                              {item.interaction.title}
                            </p>
                          </div>
                          {(() => {
                            const followUpDate = item.interaction.follow_up_date ? parseISO(item.interaction.follow_up_date) : null;
                            const daysSince = followUpDate ? Math.floor((Date.now() - followUpDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            const urgencyClass = daysSince > 60 ? 'border-destructive/60 text-destructive bg-destructive/15 animate-pulse' 
                              : daysSince > 30 ? 'border-destructive/50 text-destructive bg-destructive/10' 
                              : daysSince > 14 ? 'border-destructive/30 text-destructive' 
                              : 'border-warning/30 text-warning';
                            const urgencyLabel = daysSince > 60 ? '🔴 ' : daysSince > 30 ? '⚠️ ' : '';
                            return (
                              <Badge variant="outline" className={cn("text-[10px] font-medium shrink-0 tabular-nums", urgencyClass)} title={followUpDate ? format(followUpDate, 'dd/MM/yyyy') : ''}>
                                {urgencyLabel}{followUpDate && formatDistanceToNow(followUpDate, { addSuffix: true, locale: ptBR })}
                              </Badge>
                            );
                          })()}
                        </Link>
                      </motion.div>
                    );
                  })}
                  {overdueFollowUps.length > 4 && (
                    <Link to="/calendario" className="flex items-center justify-center gap-1.5 py-2 mt-1 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-all cursor-pointer">
                      +{overdueFollowUps.length - 4} mais <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Today's Follow-ups */}
            {todayFollowUps.length > 0 && (
              <div>
                <SectionHeader icon={Clock} label="Hoje" count={todayFollowUps.length} colorClass="bg-primary" />
                <div className="space-y-1">
                  {todayFollowUps.slice(0, 4).map((item, idx) => {
                    const Icon = interactionTypeIcons[item.interaction.type] || MessageSquare;
                    return (
                      <motion.div
                        key={item.interaction.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <Link
                          to={`/contatos/${item.interaction.contact_id}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 hover:translate-x-0.5 transition-all duration-200 group"
                        >
                          <OptimizedAvatar 
                            src={item.contact?.avatar_url || undefined}
                            alt={`${item.contact?.first_name} ${item.contact?.last_name}`}
                            fallback={getContactInitials(item.contact?.first_name, item.contact?.last_name)}
                            size="sm"
                            className="h-8 w-8"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">
                              {formatContactName(item.contact?.first_name, item.contact?.last_name)}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Icon className="w-3 h-3 shrink-0" />
                              {item.interaction.title}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                  {todayFollowUps.length > 4 && (
                    <Link to="/calendario" className="flex items-center justify-center gap-1.5 py-2 mt-1 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-all cursor-pointer">
                      +{todayFollowUps.length - 4} mais <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Empty state for left column */}
            {overdueFollowUps.length === 0 && todayFollowUps.length === 0 && (
              <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success/60" />
                <p className="text-xs text-muted-foreground">Nenhum follow-up pendente</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-4 border-l-2 border-l-warning/40 flex flex-col">
            {/* Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <div>
                <SectionHeader icon={Cake} label="Aniversários" count={upcomingBirthdays.length} colorClass="bg-warning" />
                <div className="space-y-1">
                  {upcomingBirthdays.slice(0, 3).map((item, idx) => (
                    <motion.div key={item.contact.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }}>
                      <Link
                        to={`/contatos/${item.contact.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 hover:translate-x-0.5 transition-all duration-200 group"
                      >
                        <OptimizedAvatar 
                          src={item.contact.avatar_url || undefined}
                          alt={`${item.contact.first_name} ${item.contact.last_name}`}
                          fallback={getContactInitials(item.contact.first_name, item.contact.last_name)}
                          size="sm"
                          className="h-8 w-8"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">
                            {formatContactName(item.contact.first_name, item.contact.last_name)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {toTitleCase(item.company?.name || '') || 'Sem empresa'}
                          </p>
                        </div>
                        <span className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                          item.daysUntil === 0 
                            ? 'bg-warning/15 text-warning' 
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {item.daysUntil === 0 ? 'Hoje!' : `${item.daysUntil}d`}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                  {upcomingBirthdays.length > 3 && (
                    <Link to="/contatos" className="flex items-center justify-center gap-1.5 py-2 mt-1 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-all cursor-pointer">
                      +{upcomingBirthdays.length - 3} mais <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Needs Attention */}
            {needsAttention.length > 0 && (
              <div>
                <SectionHeader icon={AlertTriangle} label="Precisam de atenção" count={needsAttention.length} colorClass="bg-warning" />
                <div className="space-y-1">
                  {needsAttention.slice(0, 4).map((item, idx) => (
                    <motion.div key={item.contact.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }}>
                      <Link
                        to={`/contatos/${item.contact.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 hover:translate-x-0.5 transition-all duration-200 group"
                      >
                        <OptimizedAvatar 
                          src={item.contact.avatar_url || undefined}
                          alt={`${item.contact.first_name} ${item.contact.last_name}`}
                          fallback={getContactInitials(item.contact.first_name, item.contact.last_name)}
                          size="sm"
                          className="h-8 w-8"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">
                            {formatContactName(item.contact.first_name, item.contact.last_name)}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.reason}
                          </p>
                        </div>
                        <span className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                          item.priority === 'high' ? 'bg-destructive/15 text-destructive' :
                          item.priority === 'medium' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
                        )}>
                          {item.priority === 'high' ? 'Alto' : item.priority === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                  {needsAttention.length > 4 && (
                    <Link to="/contatos" className="flex items-center justify-center gap-1.5 py-2 mt-1 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-all cursor-pointer">
                      +{needsAttention.length - 4} mais <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Empty state for right column */}
            {upcomingBirthdays.length === 0 && needsAttention.length === 0 && (
              <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success/60" />
                <p className="text-xs text-muted-foreground">Tudo tranquilo por aqui</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Insights Banner */}
      {newInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Link 
            to="/insights"
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 hover:bg-primary/8 border border-primary/10 hover:border-primary/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {newInsights.length} novo{newInsights.length !== 1 ? 's' : ''} insight{newInsights.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
