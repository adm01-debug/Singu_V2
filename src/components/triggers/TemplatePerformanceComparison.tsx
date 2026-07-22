import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Trophy, Star, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { PersuasionScenario, MENTAL_TRIGGERS } from '@/types/triggers';
import { ExpandedTemplateDetails } from './template-performance/ExpandedTemplateDetails';
import { useTemplatePerformanceData } from '@/hooks/useTemplatePerformanceData';

interface TemplatePerformanceComparisonProps {
  contact?: Contact;
  className?: string;
}

const scenarioLabels: Record<PersuasionScenario | 'all', string> = {
  all: 'Todos os Cenários',
  price_objection: 'Objeção de Preço',
  indecisive_client: 'Cliente Indeciso',
  lost_client_reactivation: 'Reativação de Cliente',
  initial_negotiation: 'Negociação Inicial',
  upsell_crosssell: 'Upsell/Cross-sell',
  contract_renewal: 'Renovação de Contrato',
  timing_objection: 'Objeção de Timing',
  general: 'Geral',
};

const discLabels: Record<DISCProfile, string> = {
  D: 'Dominante',
  I: 'Influente',
  S: 'Estável',
  C: 'Analítico',
};

const discColors: Record<DISCProfile, string> = {
  D: 'bg-destructive text-destructive border-destructive',
  I: 'bg-warning text-warning border-warning',
  S: 'bg-success text-success border-success',
  C: 'bg-info text-info border-info',
};

export function TemplatePerformanceComparison({ contact, className }: TemplatePerformanceComparisonProps) {
  const [selectedScenario, setSelectedScenario] = useState<PersuasionScenario | 'all'>('all');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'successRate' | 'usages' | 'avgRating'>('successRate');

  const { performanceData, topPerformer, availableScenarios } = useTemplatePerformanceData(contact, selectedScenario, sortBy);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Comparativo de Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="successRate">Taxa de Sucesso</SelectItem>
                <SelectItem value="usages">Mais Usados</SelectItem>
                <SelectItem value="avgRating">Melhor Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Compare a performance de templates do mesmo cenário
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scenario Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedScenario === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedScenario('all')}
            className="text-xs"
          >
            Todos
          </Button>
          {availableScenarios.map(scenario => (
            <Button
              key={scenario}
              variant={selectedScenario === scenario ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedScenario(scenario)}
              className="text-xs"
            >
              {scenarioLabels[scenario]}
            </Button>
          ))}
        </div>

        {/* Top Performer Highlight */}
        {topPerformer && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-muted/30 border border-warning dark:border-warning"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning dark:bg-warning">
                <Trophy className="w-5 h-5 text-warning dark:text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-warning dark:text-warning">
                  🏆 Template Campeão do Cenário
                </p>
                <p className="text-xs text-warning dark:text-warning">
                  {topPerformer.template.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-warning dark:text-warning">
                  {topPerformer.successRate.toFixed(0)}%
                </p>
                <p className="text-xs text-warning dark:text-warning">
                  {topPerformer.totalUsages} usos
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Comparison Table */}
        <ScrollArea className="h-[400px]">
          {performanceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground/70 mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum template encontrado para este cenário
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Template</TableHead>
                  <TableHead className="text-center">Usos</TableHead>
                  <TableHead className="text-center">Taxa de Sucesso</TableHead>
                  <TableHead className="text-center">Avaliação</TableHead>
                  <TableHead className="text-center">Tendência</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((data, index) => {
                  const trigger = MENTAL_TRIGGERS[data.template.trigger as keyof typeof MENTAL_TRIGGERS];
                  const isExpanded = expandedTemplate === data.template.id;
                  const isTopPerformer = index === 0 && data.totalUsages >= 3 && data.successRate > 0;

                  return (
                    <>
                      <TableRow
                        key={data.template.id}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-muted/50',
                          isExpanded && 'bg-muted/30',
                          isTopPerformer && 'bg-warning/50 dark:bg-warning/10'
                        )}
                        onClick={() => setExpandedTemplate(isExpanded ? null : data.template.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isTopPerformer && (
                              <Trophy className="w-4 h-4 text-warning shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate text-sm">
                                {data.template.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs">{trigger?.icon}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {trigger?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {data.totalUsages}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                              'text-sm font-semibold',
                              data.successRate >= 70 && 'text-success',
                              data.successRate >= 40 && data.successRate < 70 && 'text-warning',
                              data.successRate < 40 && data.successRate > 0 && 'text-destructive',
                              data.successRate === 0 && 'text-muted-foreground'
                            )}>
                              {data.totalUsages > 0 ? `${data.successRate.toFixed(0)}%` : '-'}
                            </span>
                            {data.totalUsages > 0 && (
                              <Progress
                                value={data.successRate}
                                className="h-1.5 w-16"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {data.avgRating > 0 ? (
                              <>
                                <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                                <span className="text-sm font-medium">
                                  {data.avgRating.toFixed(1)}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <TrendIcon trend={data.trend} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" aria-label="Subir" className="h-8 w-8">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      <AnimatePresence>
                      {isExpanded && (
                          <TableRow key={`${data.template.id}-details`}>
                            <TableCell colSpan={6} className="p-0">
                              <ExpandedTemplateDetails data={{
                                successCount: data.successCount,
                                neutralCount: data.neutralCount,
                                failureCount: data.failureCount,
                                lastUsed: data.lastUsed,
                                totalUsages: data.totalUsages,
                                discPerformance: data.discPerformance,
                                templateText: data.template.template,
                              }} />
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Summary Stats */}
        {performanceData.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {performanceData.length}
              </p>
              <p className="text-xs text-muted-foreground">Templates no cenário</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {performanceData.reduce((sum, d) => sum + d.totalUsages, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total de usos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {performanceData.filter(d => d.totalUsages > 0).length > 0
                  ? (
                      performanceData
                        .filter(d => d.totalUsages > 0)
                        .reduce((sum, d) => sum + d.successRate, 0) /
                      performanceData.filter(d => d.totalUsages > 0).length
                    ).toFixed(0)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Média de sucesso</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
