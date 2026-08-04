import { Building2, MapPin, TrendingUp, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Territory, TerritoryPerformance } from '@/hooks/useTerritories';

interface TerritoryCardProps {
  territory: Territory;
  performance?: TerritoryPerformance;
  onClick?: () => void;
}

export function TerritoryCard({ territory, performance, onClick }: TerritoryCardProps) {
  const states = territory.state?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const cities = territory.city?.split(',').map(c => c.trim()).filter(Boolean) ?? [];

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{territory.name}</h3>
            {territory.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {territory.description}
              </p>
            )}
          </div>
          <Badge variant={territory.region ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
            {territory.region || 'Sem região'}
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {states.length > 0
              ? states.slice(0, 3).join(', ') + (states.length > 3 ? ` +${states.length - 3}` : '')
              : 'Sem estados'}
            {cities.length > 0 && ` · ${cities.length} cidade${cities.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Manager */}
        <div className="flex items-center gap-1.5 text-xs">
          <User className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{territory.assigned_to_name || 'Sem gestor'}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-1 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span>{territory.company_count ?? 0}</span>
          </div>
          {performance && (
            <>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{(performance.conversion_rate * 100).toFixed(0)}%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                R$ {(performance.total_revenue ?? 0).toLocaleString('pt-BR')}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
