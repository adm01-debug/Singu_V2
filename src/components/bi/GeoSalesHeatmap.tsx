import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, Activity } from 'lucide-react';
import { useGeoSalesData } from '@/hooks/useBIAdvanced';
import { cn } from '@/lib/utils';

function intensityColor(count: number, max: number): string {
  if (max === 0) return 'bg-primary/10';
  const ratio = count / max;
  if (ratio >= 0.8) return 'bg-emerald-500/90';
  if (ratio >= 0.6) return 'bg-emerald-500/60';
  if (ratio >= 0.4) return 'bg-warning/60';
  if (ratio >= 0.2) return 'bg-warning/30';
  return 'bg-primary/10';
}

export const GeoSalesHeatmap = React.memo(function GeoSalesHeatmap() {
  const { data, isLoading, error } = useGeoSalesData();

  // Aggregate by state
  const stateData = useMemo(() => {
    if (!data?.length) return [];
    const map = new Map<string, { state: string; interactions: number; contacts: number; companies: number }>();
    for (const point of data) {
      const key = point.state || 'Outros';
      const curr = map.get(key) || { state: key, interactions: 0, contacts: 0, companies: 0 };
      curr.interactions += point.interaction_count;
      curr.contacts += point.contact_count;
      curr.companies++;
      map.set(key, curr);
    }
    return Array.from(map.values()).sort((a, b) => b.interactions - a.interactions);
  }, [data]);

  // Aggregate by city (top 15)
  const cityData = useMemo(() => {
    if (!data?.length) return [];
    const map = new Map<string, { city: string; state: string; interactions: number; contacts: number; companies: number }>();
    for (const point of data) {
      const key = `${point.city}-${point.state}`;
      const curr = map.get(key) || { city: point.city || 'N/A', state: point.state, interactions: 0, contacts: 0, companies: 0 };
      curr.interactions += point.interaction_count;
      curr.contacts += point.contact_count;
      curr.companies++;
      map.set(key, curr);
    }
    return Array.from(map.values()).sort((a, b) => b.interactions - a.interactions).slice(0, 15);
  }, [data]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-warning" />
          <p className="text-sm">Erro ao carregar dados geográficos.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sem dados geográficos disponíveis.</p>
          <p className="text-xs mt-1">Adicione coordenadas às empresas para ativar o heat map.</p>
        </CardContent>
      </Card>
    );
  }

  const maxInteractions = Math.max(...cityData.map(c => c.interactions), 1);
  const totalInteractions = data.reduce((a, b) => a + b.interaction_count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Heat Map Geográfico de Vendas
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição de atividade comercial por região
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">{data.length} pontos</Badge>
            <Badge variant="outline" className="text-xs">{totalInteractions} interações</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* State summary */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Por Estado</p>
          <div className="flex flex-wrap gap-2">
            {stateData.slice(0, 12).map((s) => (
              <div key={s.state} className={cn('rounded-lg px-3 py-2 text-center min-w-[60px]', intensityColor(s.interactions, stateData[0]?.interactions || 1))}>
                <p className="text-xs font-bold">{s.state || '—'}</p>
                <p className="text-[10px]">{s.interactions} int.</p>
              </div>
            ))}
          </div>
        </div>

        {/* City heatmap grid */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Top 15 Cidades</p>
          <div className="space-y-1">
            {cityData.map((city, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">{city.city}</span>
                    <span className="text-[10px] text-muted-foreground">{city.state}</span>
                  </div>
                </div>
                <div className="w-32 flex items-center gap-1">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', intensityColor(city.interactions, maxInteractions))}
                      style={{ width: `${(city.interactions / maxInteractions) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium w-8 text-right">{city.interactions}</span>
                </div>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  <span>{city.contacts} cont.</span>
                  <span>{city.companies} emp.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intensity legend */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
          <Activity className="h-3 w-3" />
          <span>Intensidade:</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary/10" /> Baixa</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/30" /> Média</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/60" /> Alta</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/90" /> Muito alta</span>
        </div>
      </CardContent>
    </Card>
  );
});

export default GeoSalesHeatmap;
