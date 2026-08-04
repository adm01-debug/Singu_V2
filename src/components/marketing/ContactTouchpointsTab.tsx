import { useTouchpoints } from '@/hooks/useAttribution';
import { useMQLClassifications } from '@/hooks/useMQL';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, FileText, Mail, MousePointerClick, Eye, Megaphone, Phone, Calendar, Magnet, Workflow } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeMeta: Record<string, { icon: typeof Activity; label: string; color: string }> = {
  form: { icon: FileText, label: 'Formulário', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  email: { icon: Mail, label: 'Email', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300' },
  page_view: { icon: Eye, label: 'Página', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
  magnet: { icon: Magnet, label: 'Lead Magnet', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-300' },
  sequence: { icon: Workflow, label: 'Sequência', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  call: { icon: Phone, label: 'Ligação', color: 'bg-green-500/10 text-green-700 dark:text-green-300' },
  meeting: { icon: Calendar, label: 'Reunião', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  ad: { icon: Megaphone, label: 'Anúncio', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
  click: { icon: MousePointerClick, label: 'Clique', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
};

export function ContactTouchpointsTab({ contactId }: { contactId: string }) {
  const { data: touchpoints, isLoading } = useTouchpoints({ contactId });
  const { data: classifications } = useMQLClassifications();
  const mql = classifications?.find((c) => c.contact_id === contactId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Status de Qualificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mql ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={mql.status === 'sql' ? 'default' : mql.status === 'mql' ? 'secondary' : 'outline'}>
                {mql.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Qualificado {formatDistanceToNow(new Date(mql.qualified_at), { locale: ptBR, addSuffix: true })}
              </span>
              {typeof mql.score_snapshot === 'number' && (
                <Badge variant="outline">Score: {mql.score_snapshot}</Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Contato ainda não classificado como MQL.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Linha do Tempo de Touchpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !touchpoints || touchpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum touchpoint registrado ainda.
            </p>
          ) : (
            <div className="relative space-y-3">
              {touchpoints.map((tp, i) => {
                const meta = typeMeta[tp.touchpoint_type] || { icon: Activity, label: tp.touchpoint_type, color: 'bg-muted text-muted-foreground' };
                const Icon = meta.icon;
                return (
                  <div key={tp.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {i < touchpoints.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{meta.label}</span>
                        {tp.source && <Badge variant="outline" className="text-[10px]">{tp.source}</Badge>}
                        {tp.medium && <Badge variant="outline" className="text-[10px]">{tp.medium}</Badge>}
                      </div>
                      {tp.campaign && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">Campanha: {tp.campaign}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(tp.occurred_at), { locale: ptBR, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
