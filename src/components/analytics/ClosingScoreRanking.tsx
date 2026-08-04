import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Filter,
  Trophy,
  Medal,
  Award,
  Users,
  Clock,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useClosingScoreRanking, ProbabilityFilter, PeriodFilter } from '@/hooks/useClosingScoreRanking';
import { cn } from '@/lib/utils';

const probabilityConfig = {
  high: {
    label: 'Alta',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    badge: 'bg-success/20 text-success border-success/30'
  },
  medium: {
    label: 'Média',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    badge: 'bg-warning/20 text-warning border-warning/30'
  },
  low: {
    label: 'Baixa',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30',
    badge: 'bg-accent/20 text-accent border-accent/30'
  },
  very_low: {
    label: 'Muito Baixa',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    badge: 'bg-destructive/20 text-destructive border-destructive/30'
  }
};

const trendIcons = {
  up: { icon: TrendingUp, color: 'text-success' },
  down: { icon: TrendingDown, color: 'text-destructive' },
  stable: { icon: Minus, color: 'text-muted-foreground' }
};

const rankIcons = [
  { icon: Trophy, color: 'text-warning' },
  { icon: Medal, color: 'text-muted-foreground' },
  { icon: Award, color: 'text-warning' }
];

interface ClosingScoreRankingProps {
  className?: string;
  maxItems?: number;
  showStats?: boolean;
  compact?: boolean;
}

export function ClosingScoreRanking({
  className,
  maxItems,
  showStats = true,
  compact = false
}: ClosingScoreRankingProps) {
  const [probabilityFilter, setProbabilityFilter] = useState<ProbabilityFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d');
  const [showAll, setShowAll] = useState(false);
  
  const { rankings, loading, refreshing, stats, refresh } = useClosingScoreRanking(
    probabilityFilter,
    periodFilter
  );
  
  const navigate = useNavigate();

  const displayedRankings = maxItems && !showAll 
    ? rankings.slice(0, maxItems) 
    : rankings;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={`ranking-skeleton-${i}`} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Ranking de Fechamento
            <Badge variant="secondary" className="ml-2">
              {stats.totalContacts} contatos
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Period Filter */}
            <Select
              value={periodFilter}
              onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}
            >
              <SelectTrigger className="w-[130px] h-8">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>

            {/* Probability Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  {probabilityFilter === 'all' ? 'Todos' : probabilityConfig[probabilityFilter].label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setProbabilityFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProbabilityFilter('high')}>
                  <span className="w-2 h-2 rounded-full bg-success mr-2" />
                  Alta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProbabilityFilter('medium')}>
                  <span className="w-2 h-2 rounded-full bg-warning mr-2" />
                  Média
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProbabilityFilter('low')}>
                  <span className="w-2 h-2 rounded-full bg-accent mr-2" />
                  Baixa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProbabilityFilter('very_low')}>
                  <span className="w-2 h-2 rounded-full bg-destructive mr-2" />
                  Muito Baixa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Overview */}
        {showStats && !compact && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.averageScore}%</p>
              <p className="text-xs text-muted-foreground">Score Médio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{stats.highProbability}</p>
              <p className="text-xs text-muted-foreground">Alta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{stats.mediumProbability}</p>
              <p className="text-xs text-muted-foreground">Média</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{stats.lowProbability}</p>
              <p className="text-xs text-muted-foreground">Baixa</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{stats.veryLowProbability}</p>
              <p className="text-xs text-muted-foreground">Muito Baixa</p>
            </div>
          </div>
        )}

        {/* Rankings List */}
        {displayedRankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {probabilityFilter !== 'all' 
                ? `Nenhum contato com probabilidade ${probabilityConfig[probabilityFilter].label.toLowerCase()}`
                : 'Nenhum contato encontrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayedRankings.map((item, index) => {
                const config = probabilityConfig[item.probability];
                const TrendIcon = trendIcons[item.trend];
                const RankIcon = index < 3 ? rankIcons[index] : null;

                return (
                  <motion.div
                    key={item.contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "relative p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer group",
                      config.bgColor,
                      config.borderColor
                    )}
                    onClick={() => navigate(`/contatos/${item.contact.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Number */}
                      <div className="flex-shrink-0 w-10 text-center">
                        {RankIcon ? (
                          <RankIcon.icon className={cn("h-6 w-6 mx-auto", RankIcon.color)} />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <OptimizedAvatar 
                        src={item.contact.avatar_url || undefined}
                        alt={`${item.contact.first_name} ${item.contact.last_name}`}
                        fallback={`${(item.contact.first_name || '?')[0]}${(item.contact.last_name || '?')[0]}`}
                        size="md"
                        className="h-12 w-12 border-2 border-background"
                      />

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">
                            {item.contact.first_name} {item.contact.last_name}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", config.badge)}
                          >
                            {config.label}
                          </Badge>
                          <TrendIcon.icon className={cn("h-4 w-4", TrendIcon.color)} />
                        </div>
                        
                        {!compact && (
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {item.interactionCount === 1 ? '1 interação' : `${item.interactionCount} interações`}
                            </span>
                            {item.lastInteractionDays !== null && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.lastInteractionDays === 0 
                                  ? 'Hoje' 
                                  : `${item.lastInteractionDays}d atrás`}
                              </span>
                            )}
                          </div>
                        )}

                        {!compact && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {item.topStrength}
                            </Badge>
                            {item.mainWeakness !== 'Nenhuma' && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                ⚠️ {item.mainWeakness}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="flex-shrink-0 text-right">
                        <div className={cn(
                          "text-2xl font-bold",
                          config.color
                        )}>
                          {item.score}%
                        </div>
                        {!compact && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.nextAction}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Score Progress Bar */}
                    <div className="mt-3">
                      <Progress 
                        value={item.score} 
                        className="h-1.5"
                      />
                    </div>

                    {/* Quick Action for High Probability */}
                    {item.probability === 'high' && !compact && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-success text-success-foreground animate-pulse">
                          <Zap className="h-3 w-3 mr-1" />
                          Fechar agora!
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Show More Button */}
        {maxItems && rankings.length > maxItems && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAll(true)}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Ver mais {rankings.length - maxItems} contatos
          </Button>
        )}

        {showAll && maxItems && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAll(false)}
          >
            Mostrar menos
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
