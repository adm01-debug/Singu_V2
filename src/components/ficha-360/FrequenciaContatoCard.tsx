import { memo, useMemo } from 'react';
import { Activity, Calendar, Clock, MessageCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ContactView360 } from '@/hooks/useContactView360';

interface Intelligence {
  best_channel?: string;
  best_time?: string;
  days_without_contact?: number;
}

interface Props {
  profile: ContactView360 | null;
  intelligence: Intelligence | null;
}

function daysBetween(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatRelative(iso?: string | null): string {
  const days = daysBetween(iso);
  if (days == null) return '—';
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const FrequenciaContatoCard = memo(({ profile, intelligence }: Props) => {
  const cadence = profile?.cadence_days ?? null;
  const lastDays = daysBetween(profile?.last_contact_at);

  const health = useMemo<{ label: string; color: string; ring: string }>(() => {
    if (lastDays == null || cadence == null) {
      return { label: 'Sem dados', color: 'bg-muted text-muted-foreground', ring: 'bg-muted' };
    }
    if (lastDays <= cadence) return { label: 'Em dia', color: 'bg-success/15 text-success', ring: 'bg-success' };
    if (lastDays <= cadence * 1.5) return { label: 'Atenção', color: 'bg-warning/15 text-warning', ring: 'bg-warning' };
    return { label: 'Atrasado', color: 'bg-destructive/15 text-destructive', ring: 'bg-destructive' };
  }, [lastDays, cadence]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Frequência de Contato
          </span>
          <Badge className={cn('text-xs font-medium border-0', health.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5', health.ring)} />
            {health.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Cadência
            </p>
            <p className="text-lg font-semibold mt-1">
              {cadence != null ? `${cadence} dias` : '—'}
            </p>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Último contato
            </p>
            <p className="text-lg font-semibold mt-1">{formatRelative(profile?.last_contact_at)}</p>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Próximo contato
            </p>
            <p className="text-sm font-medium mt-1">{formatDate(profile?.next_contact_due)}</p>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> Total interações
            </p>
            <p className="text-lg font-semibold mt-1">{profile?.interaction_count ?? 0}</p>
          </div>
        </div>

        {(intelligence?.best_channel || intelligence?.best_time) && (
          <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Melhor canal</p>
              <p className="text-sm font-medium capitalize">{intelligence?.best_channel ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Melhor horário</p>
              <p className="text-sm font-medium">{intelligence?.best_time ?? '—'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
FrequenciaContatoCard.displayName = 'FrequenciaContatoCard';
