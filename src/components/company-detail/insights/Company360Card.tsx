import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

interface Company360Data {
  health_score?: number | null;
  rfm_segment?: string | null;
  total_revenue?: number | null;
  churn_risk?: number | null;
  top_contacts?: Array<{ id: string; name: string; score?: number | null }> | null;
}

export function Company360Card({ data }: { data: Company360Data }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Brain className="h-4 w-4 text-primary" /> Visão 360°
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.health_score != null && (
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${data.health_score >= 70 ? 'text-success' : data.health_score >= 40 ? 'text-warning' : 'text-destructive'}`}>
                {data.health_score}%
              </div>
              <div className="text-xs text-muted-foreground">Saúde</div>
            </div>
          )}
          {data.rfm_segment && (
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-sm font-semibold text-foreground">{data.rfm_segment}</div>
              <div className="text-xs text-muted-foreground">Segmento RFM</div>
            </div>
          )}
          {data.total_revenue != null && (
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-lg font-bold text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(data.total_revenue)}
              </div>
              <div className="text-xs text-muted-foreground">Receita Total</div>
            </div>
          )}
          {data.churn_risk != null && (
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${data.churn_risk <= 30 ? 'text-success' : data.churn_risk <= 60 ? 'text-warning' : 'text-destructive'}`}>
                {data.churn_risk}%
              </div>
              <div className="text-xs text-muted-foreground">Risco Churn</div>
            </div>
          )}
        </div>

        {data.top_contacts && data.top_contacts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Contatos Principais</p>
            <div className="flex flex-wrap gap-2">
              {data.top_contacts.slice(0, 5).map((c) => (
                <Badge key={c.id} variant="outline" className="text-xs">
                  {c.name} {c.score != null && `(${c.score}%)`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
