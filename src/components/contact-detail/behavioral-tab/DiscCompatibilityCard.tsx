import { Users, AlertTriangle, MessageCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useDiscCompatibility } from '@/hooks/useDiscCompatibility';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const LEVEL_COLORS: Record<string, string> = {
  excellent: 'text-success', good: 'text-info', moderate: 'text-warning', challenging: 'text-destructive',
};

export function DiscCompatibilityCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useDiscCompatibility(contactId);
  const icon = <Users className="h-4 w-4 text-primary" />;

  return (
    <ExternalDataCard title="Compatibilidade DISC" icon={icon} isLoading={isLoading} error={error} hasData={!!data} emptyMessage="Sem dados de compatibilidade DISC" onRetry={refetch}>
      {data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {icon} Compatibilidade DISC
              {data.needs_adaptation_alert && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary/20">
                <span className="text-xl font-bold text-primary">{data.compatibility_score ?? '—'}</span>
              </div>
              <div>
                {data.compatibility_level && <Badge variant="outline" className={cn('text-xs', LEVEL_COLORS[data.compatibility_level] || '')}>{data.compatibility_level}</Badge>}
                <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                  {data.contact_disc && <span>Contato: <strong>{data.contact_disc}</strong></span>}
                  {data.user_disc && <span>Você: <strong>{data.user_disc}</strong></span>}
                </div>
              </div>
            </div>

            {(data.contact_d != null || data.contact_i != null) && (
              <div className="space-y-1">
                {[{ label: 'D', value: data.contact_d }, { label: 'I', value: data.contact_i }, { label: 'S', value: data.contact_s }, { label: 'C', value: data.contact_c }].map(({ label, value }) => value != null && (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-4 text-xs font-bold text-muted-foreground">{label}</span>
                    <Progress value={value} className="h-1.5 flex-1" />
                    <span className="w-8 text-right text-xs">{value}%</span>
                  </div>
                ))}
              </div>
            )}

            {data.communication_tips && data.communication_tips.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1"><MessageCircle className="h-3 w-3" /> Dicas de Comunicação</p>
                <ul className="space-y-0.5">{data.communication_tips.slice(0, 3).map((tip, i) => <li key={i} className="text-xs text-foreground">• {tip}</li>)}</ul>
              </div>
            )}

            {data.potential_conflicts && data.potential_conflicts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-warning flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Conflitos Potenciais</p>
                <ul className="space-y-0.5">{data.potential_conflicts.slice(0, 3).map((c, i) => <li key={i} className="text-xs text-muted-foreground">• {c}</li>)}</ul>
              </div>
            )}

            {data.recommended_approach && (
              <div className="flex items-start gap-1.5 bg-muted/50 rounded-md p-2">
                <Lightbulb className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                <p className="text-xs text-foreground">{data.recommended_approach}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </ExternalDataCard>
  );
}
