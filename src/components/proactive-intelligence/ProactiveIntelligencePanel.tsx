import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, MessageSquare, ChevronDown, ChevronUp, Copy, Check,
  AlertTriangle, TrendingUp, Target, Heart, Sparkles, Shield, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type {
  ProactiveIntelligenceResult,
  NextBestAction,
  ApproachScript,
  IntelligenceInsight,
  ActionPriority,
} from '@/hooks/useProactiveIntelligence';

interface ProactiveIntelligencePanelProps {
  data: ProactiveIntelligenceResult;
  contactName: string;
}

const priorityConfig: Record<ActionPriority, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: 'Crítico' },
  high: { color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'Alto' },
  medium: { color: 'text-info', bg: 'bg-info/10 border-info/30', label: 'Médio' },
  low: { color: 'text-success', bg: 'bg-success/10 border-success/30', label: 'Baixo' },
};

const trendIcons: Record<string, { icon: typeof TrendingUp; color: string }> = {
  up: { icon: TrendingUp, color: 'text-success' },
  down: { icon: TrendingUp, color: 'text-destructive rotate-180' },
  stable: { icon: Target, color: 'text-muted-foreground' },
  warning: { icon: AlertTriangle, color: 'text-warning' },
};

// ============================================
// ACTION CARD
// ============================================
function ActionCard({ action }: { action: NextBestAction }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = priorityConfig[action.priority];

  const copyScript = () => {
    if (action.script) {
      navigator.clipboard.writeText(action.script)
        .then(() => { setCopied(true); toast.success('Script copiado!'); setTimeout(() => setCopied(false), 2000); })
        .catch(() => toast.error('Não foi possível copiar'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('border rounded-lg p-3 transition-all', config.bg)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg" aria-hidden="true">{action.icon}</span>
            <h4 className="font-semibold text-sm text-foreground truncate">{action.title}</h4>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config.color)}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
              {/* Channel + Timing */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <MessageSquare className="w-3 h-3 text-primary" aria-hidden="true" />
                  <span className="text-muted-foreground">{action.channel}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3 text-primary" aria-hidden="true" />
                  <span className="text-muted-foreground">{action.timing}</span>
                </div>
              </div>

              {/* Script */}
              {action.script && (
                <div className="bg-background/60 rounded-md p-2.5 relative group">
                  <p className="text-xs text-foreground italic pr-6">"{action.script}"</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1.5 right-1.5 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={copyScript}
                  >
                    {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              )}

              {/* Frameworks */}
              <div className="flex flex-wrap gap-1">
                {action.frameworks.map(f => (
                  <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {f}
                  </Badge>
                ))}
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Confiança: {action.confidence}%</span>
                <span>Impacto estimado: {action.estimatedImpact}%</span>
              </div>

              {/* Reason */}
              <p className="text-[10px] text-muted-foreground/70 italic">💡 {action.reason}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// SCRIPT CARD
// ============================================
function ScriptCard({ script }: { script: ApproachScript }) {
  const [copied, setCopied] = useState(false);

  const fullScript = `${script.opening}\n\n${script.body}\n\n${script.closing}`;

  const copyFullScript = () => {
    navigator.clipboard.writeText(fullScript)
      .then(() => { setCopied(true); toast.success('Script completo copiado!'); setTimeout(() => setCopied(false), 2000); })
      .catch(() => toast.error('Não foi possível copiar'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border/50 rounded-lg p-3 space-y-2 bg-card"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground">{script.title}</h4>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyFullScript}>
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">{script.scenario}</p>

      <div className="space-y-1.5">
        <div className="bg-primary/5 rounded p-2">
          <p className="text-[10px] font-medium text-primary mb-0.5">Abertura:</p>
          <p className="text-xs text-foreground">{script.opening}</p>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Desenvolvimento:</p>
          <p className="text-xs text-foreground">{script.body}</p>
        </div>
        <div className="bg-accent/30 rounded p-2">
          <p className="text-[10px] font-medium text-accent-foreground mb-0.5">Fechamento:</p>
          <p className="text-xs text-foreground">{script.closing}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-1 pt-1">
        <Badge variant="outline" className="text-[10px]">📡 {script.channel}</Badge>
        <Badge variant="outline" className="text-[10px]">🎯 {script.adaptedFor}</Badge>
        <Badge variant="outline" className="text-[10px]">🧠 {script.neuralTarget}</Badge>
      </div>

      {/* Key Phrases */}
      <div className="text-[10px] text-muted-foreground">
        <span className="font-medium">Use: </span>
        {script.keyPhrases.slice(0, 4).join(' · ')}
      </div>
      <div className="text-[10px] text-destructive/70">
        <span className="font-medium">Evite: </span>
        {script.wordsToAvoid.join(' · ')}
      </div>
    </motion.div>
  );
}

// ============================================
// INSIGHT ROW
// ============================================
function InsightRow({ insight }: { insight: IntelligenceInsight }) {
  const trend = trendIcons[insight.trend] || trendIcons.stable;
  const TrendIcon = trend.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-between py-2 px-1 hover:bg-muted/30 rounded transition-colors cursor-default">
          <div className="flex items-center gap-2">
            <TrendIcon className={cn('w-3.5 h-3.5', trend.color)} aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{insight.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{insight.value}</span>
            <Badge variant="secondary" className="text-[9px] px-1 py-0">{insight.framework}</Badge>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p className="text-xs">{insight.detail}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================
// MAIN PANEL
// ============================================
export function ProactiveIntelligencePanel({ data, contactName }: ProactiveIntelligencePanelProps) {
  const { actions, scripts, insights, healthScore, urgencyLevel, summary } = data;
  const urgencyConfig = priorityConfig[urgencyLevel];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm">
              <Brain className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-sm">Inteligência Proativa</CardTitle>
              <p className="text-[10px] text-muted-foreground">DISC · VAK · Neuro · Carnegie</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-primary" aria-hidden="true" />
                    <span className="text-sm font-bold text-foreground">{healthScore}</span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Saúde</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Score de saúde do relacionamento com {contactName}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Health bar */}
        <Progress
          value={healthScore}
          className="h-1.5 mt-2"
        />

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn('mt-2 p-2 rounded-md text-xs border', urgencyConfig.bg)}
        >
          {summary}
        </motion.div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs defaultValue="actions" className="space-y-3">
          <TabsList className="w-full h-8 bg-muted/40">
            <TabsTrigger value="actions" className="text-[11px] gap-1 flex-1">
              <Zap className="w-3 h-3" /> Ações ({actions.length})
            </TabsTrigger>
            <TabsTrigger value="scripts" className="text-[11px] gap-1 flex-1">
              <MessageSquare className="w-3 h-3" /> Scripts ({scripts.length})
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-[11px] gap-1 flex-1">
              <Sparkles className="w-3 h-3" /> Perfil ({insights.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="space-y-2 mt-0">
            {actions.length === 0 ? (
              <div className="text-center py-6">
                <Shield className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Tudo em ordem! Nenhuma ação urgente.</p>
              </div>
            ) : (
              actions.map(action => <ActionCard key={action.id} action={action} />)
            )}
          </TabsContent>

          <TabsContent value="scripts" className="space-y-3 mt-0">
            {scripts.map(script => <ScriptCard key={script.id} script={script} />)}
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <div className="divide-y divide-border/30">
              {insights.map(insight => <InsightRow key={insight.id} insight={insight} />)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
