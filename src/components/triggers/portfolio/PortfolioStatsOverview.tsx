import { Users, Crown, Star, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PortfolioStats, LEVEL_CONFIG } from './portfolioTypes';

interface PortfolioStatsOverviewProps {
  stats: PortfolioStats;
}

export function PortfolioStatsOverview({ stats }: PortfolioStatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="p-3 rounded-lg bg-muted/50 text-center">
        <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-xs text-muted-foreground">Total</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.excellent.bgColor)}>
        <Crown className="w-5 h-5 mx-auto mb-1 text-success" />
        <p className="text-2xl font-bold text-success">{stats.excellent}</p>
        <p className="text-xs text-muted-foreground">Excelentes</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.good.bgColor)}>
        <Star className="w-5 h-5 mx-auto mb-1 text-info" />
        <p className="text-2xl font-bold text-info">{stats.good}</p>
        <p className="text-xs text-muted-foreground">Boas</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.moderate.bgColor)}>
        <Zap className="w-5 h-5 mx-auto mb-1 text-warning" />
        <p className="text-2xl font-bold text-warning">{stats.moderate}</p>
        <p className="text-xs text-muted-foreground">Moderadas</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.challenging.bgColor)}>
        <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
        <p className="text-2xl font-bold text-destructive">{stats.challenging}</p>
        <p className="text-xs text-muted-foreground">Desafiadoras</p>
      </div>
    </div>
  );
}
