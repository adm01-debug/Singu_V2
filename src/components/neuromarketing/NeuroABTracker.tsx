// ==============================================
// NEURO A/B TRACKER - Track Neural Approach Effectiveness
// ==============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FlaskConical, 
  TrendingUp, 
  TrendingDown,
  Target,
  Brain,
  Zap,
  Heart,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainSystem, PrimalStimulus, Neurochemical } from '@/types/neuromarketing';
import { BRAIN_SYSTEM_INFO, PRIMAL_STIMULUS_INFO, NEUROCHEMICAL_INFO } from '@/data/neuromarketingData';
import { cn } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'stable';

interface ApproachResult {
  id: string;
  approachType: 'brain' | 'stimulus' | 'chemical';
  approachValue: BrainSystem | PrimalStimulus | Neurochemical;
  usedAt: string;
  outcome: 'success' | 'neutral' | 'failure';
  conversionValue?: number;
  notes?: string;
}

interface NeuroABTrackerProps {
  contactId?: string;
  contactName?: string;
  results?: ApproachResult[];
  onRecordResult?: (result: Omit<ApproachResult, 'id' | 'usedAt'>) => void;
  className?: string;
}

interface ApproachStats {
  type: string;
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  totalUses: number;
  successCount: number;
  neutralCount: number;
  failureCount: number;
  successRate: number;
  trend: TrendDirection;
  avgConversionValue: number;
}

const NeuroABTracker = ({
  contactId,
  contactName,
  results = [],
  onRecordResult,
  className
}: NeuroABTrackerProps) => {
  const [activeTab, setActiveTab] = useState<'brain' | 'stimulus' | 'chemical'>('brain');

  // Calculate stats for each approach
  const approachStats = useMemo(() => {
    const stats: ApproachStats[] = [];

    // Brain system stats
    (['reptilian', 'limbic', 'neocortex'] as BrainSystem[]).forEach(brain => {
      const brainResults = results.filter(r => r.approachType === 'brain' && r.approachValue === brain);
      const info = BRAIN_SYSTEM_INFO[brain];
      
      if (brainResults.length > 0 || activeTab === 'brain') {
        const successCount = brainResults.filter(r => r.outcome === 'success').length;
        const neutralCount = brainResults.filter(r => r.outcome === 'neutral').length;
        const failureCount = brainResults.filter(r => r.outcome === 'failure').length;
        const totalUses = brainResults.length;
        const successRate = totalUses > 0 ? (successCount / totalUses) * 100 : 0;
        
        // Calculate trend (last 3 vs previous 3)
        const recent = brainResults.slice(-3);
        const previous = brainResults.slice(-6, -3);
        const recentSuccess = recent.filter(r => r.outcome === 'success').length / Math.max(1, recent.length);
        const prevSuccess = previous.filter(r => r.outcome === 'success').length / Math.max(1, previous.length);
        const trend: TrendDirection = recentSuccess > prevSuccess ? 'up' : recentSuccess < prevSuccess ? 'down' : 'stable';

        const avgConversionValue = brainResults
          .filter(r => r.conversionValue)
          .reduce((acc, r) => acc + (r.conversionValue || 0), 0) / Math.max(1, brainResults.filter(r => r.conversionValue).length);

        stats.push({
          type: 'brain',
          value: brain,
          label: info.namePt,
          icon: <Brain className="h-4 w-4" />,
          color: info.color,
          totalUses,
          successCount,
          neutralCount,
          failureCount,
          successRate,
          trend,
          avgConversionValue
        });
      }
    });

    // Stimulus stats
    (['self_centered', 'contrast', 'tangible', 'memorable', 'visual', 'emotional'] as PrimalStimulus[]).forEach(stimulus => {
      const stimulusResults = results.filter(r => r.approachType === 'stimulus' && r.approachValue === stimulus);
      const info = PRIMAL_STIMULUS_INFO[stimulus];
      
      if (stimulusResults.length > 0 || activeTab === 'stimulus') {
        const successCount = stimulusResults.filter(r => r.outcome === 'success').length;
        const neutralCount = stimulusResults.filter(r => r.outcome === 'neutral').length;
        const failureCount = stimulusResults.filter(r => r.outcome === 'failure').length;
        const totalUses = stimulusResults.length;
        const successRate = totalUses > 0 ? (successCount / totalUses) * 100 : 0;
        
        const recent = stimulusResults.slice(-3);
        const previous = stimulusResults.slice(-6, -3);
        const recentSuccess = recent.filter(r => r.outcome === 'success').length / Math.max(1, recent.length);
        const prevSuccess = previous.filter(r => r.outcome === 'success').length / Math.max(1, previous.length);
        const trend: TrendDirection = recentSuccess > prevSuccess ? 'up' : recentSuccess < prevSuccess ? 'down' : 'stable';

        const avgConversionValue = stimulusResults
          .filter(r => r.conversionValue)
          .reduce((acc, r) => acc + (r.conversionValue || 0), 0) / Math.max(1, stimulusResults.filter(r => r.conversionValue).length);

        stats.push({
          type: 'stimulus',
          value: stimulus,
          label: info.namePt,
          icon: <Zap className="h-4 w-4" />,
          color: info.color,
          totalUses,
          successCount,
          neutralCount,
          failureCount,
          successRate,
          trend,
          avgConversionValue
        });
      }
    });

    // Neurochemical stats
    (['dopamine', 'oxytocin', 'cortisol', 'serotonin', 'endorphin', 'adrenaline'] as Neurochemical[]).forEach(chemical => {
      const chemicalResults = results.filter(r => r.approachType === 'chemical' && r.approachValue === chemical);
      const info = NEUROCHEMICAL_INFO[chemical];
      
      if (chemicalResults.length > 0 || activeTab === 'chemical') {
        const successCount = chemicalResults.filter(r => r.outcome === 'success').length;
        const neutralCount = chemicalResults.filter(r => r.outcome === 'neutral').length;
        const failureCount = chemicalResults.filter(r => r.outcome === 'failure').length;
        const totalUses = chemicalResults.length;
        const successRate = totalUses > 0 ? (successCount / totalUses) * 100 : 0;
        
        const recent = chemicalResults.slice(-3);
        const previous = chemicalResults.slice(-6, -3);
        const recentSuccess = recent.filter(r => r.outcome === 'success').length / Math.max(1, recent.length);
        const prevSuccess = previous.filter(r => r.outcome === 'success').length / Math.max(1, previous.length);
        const trend: TrendDirection = recentSuccess > prevSuccess ? 'up' : recentSuccess < prevSuccess ? 'down' : 'stable';

        const avgConversionValue = chemicalResults
          .filter(r => r.conversionValue)
          .reduce((acc, r) => acc + (r.conversionValue || 0), 0) / Math.max(1, chemicalResults.filter(r => r.conversionValue).length);

        stats.push({
          type: 'chemical',
          value: chemical,
          label: info.namePt,
          icon: <Heart className="h-4 w-4" />,
          color: info.color,
          totalUses,
          successCount,
          neutralCount,
          failureCount,
          successRate,
          trend,
          avgConversionValue
        });
      }
    });

    return stats;
  }, [results, activeTab]);

  const filteredStats = approachStats.filter(s => s.type === activeTab);
  const bestApproach = [...filteredStats].sort((a, b) => b.successRate - a.successRate)[0];
  const worstApproach = [...filteredStats].filter(s => s.totalUses > 0).sort((a, b) => a.successRate - b.successRate)[0];

  const tabs = [
    { id: 'brain' as const, label: 'Cérebro', icon: Brain },
    { id: 'stimulus' as const, label: 'Estímulos', icon: Zap },
    { id: 'chemical' as const, label: 'Químicos', icon: Heart }
  ];

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Neuro A/B Tracker</CardTitle>
              <p className="text-xs text-muted-foreground">
                Eficácia de abordagens neurais para {contactName}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            {results.length} testes
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Quick Insights */}
        {filteredStats.some(s => s.totalUses > 0) && (
          <div className="grid grid-cols-2 gap-2">
            {bestApproach && bestApproach.totalUses > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-success/10 border border-success/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs font-medium text-success dark:text-success">
                    Melhor Abordagem
                  </span>
                </div>
                <p className="font-semibold text-sm">{bestApproach.label}</p>
                <p className="text-xs text-muted-foreground">
                  {bestApproach.successRate.toFixed(0)}% sucesso
                </p>
              </motion.div>
            )}

            {worstApproach && worstApproach !== bestApproach && worstApproach.totalUses > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-medium text-destructive">
                    Evitar
                  </span>
                </div>
                <p className="font-semibold text-sm">{worstApproach.label}</p>
                <p className="text-xs text-muted-foreground">
                  {worstApproach.successRate.toFixed(0)}% sucesso
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Approach Cards */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredStats.map((stat, index) => (
              <motion.div
                key={`${stat.type}-${stat.value}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-1.5 rounded-md"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      {stat.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{stat.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.totalUses} {stat.totalUses === 1 ? 'uso' : 'usos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {stat.trend === 'up' && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                    {stat.trend === 'down' && (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: stat.color }}>
                        {stat.successRate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">sucesso</p>
                    </div>
                  </div>
                </div>

                {stat.totalUses > 0 && (
                  <>
                    <Progress 
                      value={stat.successRate} 
                      className="h-2 mb-2"
                    />

                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-muted-foreground">
                          {stat.successCount} sucesso
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <span className="text-muted-foreground">
                          {stat.neutralCount} neutro
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="text-muted-foreground">
                          {stat.failureCount} falha
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {stat.totalUses === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum teste registrado ainda
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {results.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum teste A/B registrado</p>
            <p className="text-xs mt-1">
              Registre resultados de abordagens neurais para descobrir o que funciona melhor
            </p>
          </div>
        )}

        {/* Recommendations */}
        {bestApproach && bestApproach.totalUses >= 3 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Recomendação Baseada em Dados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Com base em {results.length} testes, a abordagem <strong>{bestApproach.label}</strong> tem 
                  a maior taxa de sucesso ({bestApproach.successRate.toFixed(0)}%). 
                  Considere priorizar esta estratégia nas próximas interações.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroABTracker;
