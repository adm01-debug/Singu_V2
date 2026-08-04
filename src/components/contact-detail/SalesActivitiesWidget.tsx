import React from 'react';
import { Activity, Phone, Mail, Users, MessageCircle, Linkedin, MoreHorizontal, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSalesActivities, SalesActivity } from '@/hooks/useSalesActivities';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactName: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4 text-info" />,
  email: <Mail className="h-4 w-4 text-primary" />,
  meeting: <Users className="h-4 w-4 text-success" />,
  whatsapp: <MessageCircle className="h-4 w-4 text-success" />,
  linkedin: <Linkedin className="h-4 w-4 text-info" />,
  other: <MoreHorizontal className="h-4 w-4 text-muted-foreground" />,
};

const outcomeColors: Record<string, string> = {
  connected: 'bg-success/10 text-success border-success/20',
  scheduled: 'bg-info/10 text-info border-info/20',
  qualified: 'bg-primary/10 text-primary border-primary/20',
  no_answer: 'bg-muted text-muted-foreground',
  voicemail: 'bg-warning/10 text-warning border-warning/20',
  busy: 'bg-warning/10 text-warning border-warning/20',
  callback: 'bg-info/10 text-info border-info/20',
  not_interested: 'bg-destructive/10 text-destructive border-destructive/20',
};

const outcomeLabels: Record<string, string> = {
  connected: 'Conectado',
  scheduled: 'Agendado',
  qualified: 'Qualificado',
  no_answer: 'Sem Resposta',
  voicemail: 'Correio de Voz',
  busy: 'Ocupado',
  callback: 'Retorno',
  not_interested: 'Sem Interesse',
};

function ActivityRow({ activity }: { activity: SalesActivity }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="mt-0.5">
        {activityIcons[activity.activity_type || 'other'] || activityIcons.other}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium capitalize">
            {activity.activity_type || 'Atividade'}
          </span>
          {activity.outcome && (
            <Badge variant="outline" className={`text-[10px] ${outcomeColors[activity.outcome] || ''}`}>
              {outcomeLabels[activity.outcome] || activity.outcome}
            </Badge>
          )}
          {activity.duration_minutes && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {activity.duration_minutes}min
            </span>
          )}
        </div>
        {activity.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.notes}</p>
        )}
        {activity.created_at && (
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(activity.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  );
}

export const SalesActivitiesWidget = React.memo(function SalesActivitiesWidget({ contactName }: Props) {
  const { data: activities, isLoading, error } = useSalesActivities(contactName);

  return (
    <ExternalDataCard
      title="Atividades de Vendas"
      icon={<Activity className="h-4 w-4 text-primary" />}
      isLoading={isLoading}
      error={error}
      hasData={!!activities && activities.length > 0}
      emptyMessage="Nenhuma atividade de vendas encontrada"
    >
      {activities && activities.length > 0 && (
        <div className="space-y-0">
          {activities.slice(0, 10).map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
          {activities.length > 10 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              +{activities.length - 10} atividades anteriores
            </p>
          )}
        </div>
      )}
    </ExternalDataCard>
  );
});
