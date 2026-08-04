import React from 'react';
import { Clock, Phone, Mail, Video, MessageSquare, Globe, Send, AtSign, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MotionStyle, Transition, TargetAndTransition } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface StaggerAnimation {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
  style: MotionStyle;
}

interface RecentActivityCardProps {
  activities: DashboardStats['recentActivities'];
  animations: StaggerAnimation[];
}

/** Map interaction type + channel to a specific icon and color */
function getActivityVisual(type: string, description: string) {
  const desc = description.toLowerCase();
  
  if (desc.includes('whatsapp')) return { icon: MessageSquare, bg: 'bg-success/10 ring-success/20', color: 'text-success', label: 'WhatsApp' };
  if (desc.includes('email') || type === 'email') return { icon: Mail, bg: 'bg-info/10 ring-info/20', color: 'text-info', label: 'E-mail' };
  if (desc.includes('instagram') || desc.includes('facebook') || desc.includes('linkedin')) return { icon: AtSign, bg: 'bg-accent/10 ring-accent/20', color: 'text-accent', label: 'Social' };
  if (type === 'call' || desc.includes('ligação') || desc.includes('telefone')) return { icon: Phone, bg: 'bg-warning/10 ring-warning/20', color: 'text-warning', label: 'Ligação' };
  if (type === 'meeting' || desc.includes('reunião')) return { icon: Video, bg: 'bg-primary/10 ring-primary/20', color: 'text-primary', label: 'Reunião' };
  if (desc.includes('mensagem')) return { icon: Send, bg: 'bg-success/10 ring-success/20', color: 'text-success', label: 'Mensagem' };
  
  return { icon: Globe, bg: 'bg-muted ring-border/30', color: 'text-muted-foreground', label: 'Outro' };
}

/** Get time-based color for the timestamp */
function getTimeColor(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 1) return 'text-success';
  if (days <= 7) return 'text-muted-foreground';
  if (days <= 30) return 'text-warning';
  return 'text-destructive/70';
}

/** Deduplicate consecutive activities from the same contact */
function deduplicateActivities(activities: DashboardStats['recentActivities']): DashboardStats['recentActivities'] {
  if (activities.length === 0) return activities;
  
  const result: DashboardStats['recentActivities'] = [activities[0]];
  for (let i = 1; i < activities.length; i++) {
    const prev = activities[i - 1];
    const curr = activities[i];
    if (curr.entityName === prev.entityName && curr.type === prev.type) continue;
    result.push(curr);
  }
  return result;
}

export const RecentActivityCard = React.memo(function RecentActivityCard({ activities, animations }: RecentActivityCardProps) {
  const dedupedActivities = deduplicateActivities(activities);
  
  return (
    <Card className="h-full border-border/60 hover:border-border transition-colors overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent/60 rounded-t-xl" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 ring-1 ring-primary/20">
            <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          </div>
          Atividade Recente
        </CardTitle>
        {dedupedActivities.length > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {dedupedActivities.length} registro{dedupedActivities.length !== 1 ? 's' : ''}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[320px]">
          <div className="space-y-1 pr-2">
            {dedupedActivities.length === 0 ? (
              <EmptyState
                illustration="interactions"
                title="Sem atividade recente"
                description="Registre interações com seus contatos para acompanhar o progresso."
              />
            ) : (
              <>
                {dedupedActivities.map((activity, index) => {
                  const animation = animations[index];
                  const visual = getActivityVisual(activity.type, activity.description);
                  const Icon = visual.icon;
                  const timeColor = getTimeColor(activity.createdAt);
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={animation?.initial}
                      animate={animation?.animate}
                      transition={animation?.transition}
                      style={animation?.style}
                    >
                      <Link
                        to={`/contatos/${activity.contactId}`}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all group cursor-pointer"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ring-1", visual.bg)}>
                          <Icon className={cn("w-3.5 h-3.5", visual.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {activity.entityName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {activity.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-1">
                          <span className={cn("text-[10px] whitespace-nowrap tabular-nums font-medium", timeColor)}>
                            {formatDistanceToNow(activity.createdAt, { locale: ptBR, addSuffix: true })}
                          </span>
                          <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", visual.bg.replace('ring-', ''))}>
                            <span className={visual.color}>{visual.label}</span>
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
                
                {/* Link to full history */}
                <Link 
                  to="/contatos" 
                  className="flex items-center justify-center gap-1.5 py-2.5 mt-1 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-all"
                >
                  Ver histórico completo <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
