import { Brain, Clock, TrendingUp, MessageCircle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactIntelligence } from '@/hooks/useContactIntelligence';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ContactIntelligenceWidget({ contactId }: Props) {
  const { data, isLoading, error } = useContactIntelligence(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const metrics = [
    { icon: TrendingUp, label: 'Score Relacionamento', value: data.relationship_score, color: 'text-primary', suffix: '/100' },
    { icon: Target, label: 'Engajamento', value: data.engagement_score, color: 'text-success', suffix: '/100' },
    { icon: MessageCircle, label: 'Total Interações', value: data.total_interactions, color: 'text-info' },
    { icon: Clock, label: 'Sem contato', value: data.days_without_contact, color: 'text-warning', suffix: ' dias' },
  ].filter(m => m.value !== undefined && m.value !== null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-primary" />
          Inteligência 360°
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key badges */}
        <div className="flex flex-wrap gap-1.5">
          {data.disc_profile && (
            <Badge variant="outline" className="text-[10px]">DISC: {data.disc_profile}</Badge>
          )}
          {data.eq_level && (
            <Badge variant="outline" className="text-[10px]">EQ: {data.eq_level}</Badge>
          )}
          {data.sentiment && (
            <Badge variant="outline" className={cn('text-[10px]',
              data.sentiment === 'positive' ? 'border-success/40 text-success' :
              data.sentiment === 'negative' ? 'border-destructive/40 text-destructive' : ''
            )}>
              {data.sentiment}
            </Badge>
          )}
          {data.churn_risk && (
            <Badge variant="outline" className={cn('text-[10px]',
              data.churn_risk === 'high' ? 'border-destructive/40 text-destructive bg-destructive/10' :
              data.churn_risk === 'medium' ? 'border-warning/40 text-warning bg-warning/10' :
              'border-success/40 text-success bg-success/10'
            )}>
              Churn: {data.churn_risk}
            </Badge>
          )}
          {data.best_channel && (
            <Badge variant="outline" className="text-[10px] border-info/40 text-info">
              Canal: {data.best_channel}
            </Badge>
          )}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.map(({ icon: Icon, label, value, color, suffix }) => (
            <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
              <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
              <div className="min-w-0">
                <p className={cn('text-sm font-semibold tabular-nums', color)}>
                  {value}{suffix || ''}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Deal info */}
        {(data.open_deals !== undefined || data.nps_score !== undefined) && (
          <div className="flex items-center gap-3 pt-1 border-t border-border/20 text-xs text-muted-foreground">
            {data.open_deals !== undefined && (
              <span>📊 {data.open_deals} negócios abertos</span>
            )}
            {data.total_deal_value !== undefined && data.total_deal_value > 0 && (
              <span>💰 R$ {Number(data.total_deal_value).toLocaleString('pt-BR')}</span>
            )}
            {data.nps_score !== undefined && (
              <span>⭐ NPS: {data.nps_score}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
