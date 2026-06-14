import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Check, Code2, Eye } from 'lucide-react';
import { useEmbeddableDashboards } from '@/hooks/useBIAdvanced';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const widgetLabels: Record<string, string> = {
  kpis: 'KPIs Principais',
  pipeline: 'Pipeline',
  forecast: 'Previsão de Demanda',
  cohort: 'Análise de Coorte',
  conversion: 'Funil de Conversão',
  velocity: 'Velocidade de Deals',
  profitability: 'Rentabilidade',
  geo: 'Mapa Geográfico',
  churn: 'Risco de Churn',
  sentiment: 'Sentimento',
  engagement: 'Engajamento',
};

const dashboardColors: Record<string, string> = {
  executive: 'from-primary/20 to-primary/5',
  sales: 'from-emerald-500/20 to-emerald-500/5',
  'customer-health': 'from-warning/20 to-warning/5',
};

export const EmbeddableDashboards = React.memo(function EmbeddableDashboards() {
  const { dashboards } = useEmbeddableDashboards();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleCopyEmbed = (id: string) => {
    const embedCode = `<iframe
  src="${window.location.origin}/embed/dashboard/${id}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid #e2e8f0;"
  title="SINGU Dashboard - ${id}"
></iframe>`;

    navigator.clipboard.writeText(embedCode).then(() => {
      setCopiedId(id);
      toast.success('Código de embed copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          Dashboards Embeddable
        </CardTitle>
        <CardDescription className="text-xs">
          Dashboards prontos para incorporar em relatórios, portais e apresentações (Metabase/Looker style)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className={cn(
              'rounded-xl border p-4 bg-gradient-to-br transition-all hover:shadow-md',
              dashboardColors[dashboard.id] || 'from-muted/50 to-muted/20'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">{dashboard.title}</h3>
                <p className="text-xs text-muted-foreground">{dashboard.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {dashboard.widgets.map((w) => (
                    <Badge key={w} variant="outline" className="text-[10px] bg-background/60">
                      {widgetLabels[w] || w}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setPreviewId(previewId === dashboard.id ? null : dashboard.id)}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => handleCopyEmbed(dashboard.id)}
                >
                  {copiedId === dashboard.id ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Code2 className="h-3 w-3" />
                  )}
                  Embed
                </Button>
              </div>
            </div>

            {/* Preview expanded */}
            {previewId === dashboard.id && (
              <div className="mt-3 p-3 rounded-lg bg-background/80 border text-xs text-muted-foreground">
                <p className="font-medium mb-2">📋 Widgets incluídos:</p>
                <ul className="space-y-1 pl-4">
                  {dashboard.widgets.map((w) => (
                    <li key={w} className="list-disc">{widgetLabels[w] || w}</li>
                  ))}
                </ul>
                <div className="mt-3 p-2 rounded bg-muted/50 font-mono text-[10px] overflow-x-auto">
                  {`<iframe src="${window.location.origin}/embed/dashboard/${dashboard.id}" width="100%" height="600" />`}
                </div>
              </div>
            )}
          </div>
        ))}

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          💡 Os dashboards embeddable usam autenticação via token para acesso seguro em portais externos.
        </p>
      </CardContent>
    </Card>
  );
});

export default EmbeddableDashboards;
