import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Zap, Shield, AlertTriangle, Eye, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CognitiveBiasType, BiasCategory, DetectedBias } from '@/types/cognitive-biases';
import { COGNITIVE_BIAS_INFO, BIAS_CATEGORY_INFO } from '@/data/cognitiveBiasesData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getPolarityColor(polarity: DetectedBias['polarity']) {
  switch (polarity) {
    case 'exploitable': return 'text-success bg-success';
    case 'obstacle': return 'text-destructive bg-destructive';
    default: return 'text-muted-foreground bg-muted';
  }
}

function getPolarityIcon(polarity: DetectedBias['polarity']) {
  switch (polarity) {
    case 'exploitable': return <Zap className="w-3 h-3" />;
    case 'obstacle': return <Shield className="w-3 h-3" />;
    default: return <Eye className="w-3 h-3" />;
  }
}

export function BiasCard({ biasType, count, isExpanded, onToggle }: { biasType: CognitiveBiasType; count: number; isExpanded: boolean; onToggle: () => void }) {
  const info = COGNITIVE_BIAS_INFO[biasType];
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('border rounded-lg p-4 transition-all hover:shadow-md', info.bgColor)}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><span className="text-2xl">{info.icon}</span><div><h4 className="font-medium">{info.namePt}</h4><p className="text-xs text-muted-foreground">{info.name}</p></div></div>
              <div className="flex items-center gap-2"><Badge variant="secondary" className="text-xs">{count}x detectado</Badge>{isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}</div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{info.descriptionPt}</p>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <AnimatePresence>{isExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t space-y-4">
              <div className="p-3 rounded bg-background/50"><h5 className="text-sm font-medium mb-1">📌 Exemplo</h5><p className="text-sm text-muted-foreground">{info.example}</p></div>
              <div className="space-y-3">
                <div className="p-3 rounded bg-success dark:bg-success/20"><h5 className="text-sm font-medium text-success dark:text-success mb-1 flex items-center gap-1"><Zap className="w-4 h-4" />Como Usar a Favor</h5><p className="text-sm text-success dark:text-success">{info.salesApplication.howToLeverage}</p></div>
                <div className="p-3 rounded bg-warning dark:bg-warning/20"><h5 className="text-sm font-medium text-warning dark:text-warning mb-1 flex items-center gap-1"><Shield className="w-4 h-4" />Como Contornar</h5><p className="text-sm text-warning dark:text-warning">{info.salesApplication.howToCounter}</p></div>
                <div className="p-3 rounded bg-info dark:bg-info/20"><h5 className="text-sm font-medium text-info dark:text-info mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Nota Ética</h5><p className="text-sm text-info dark:text-info">{info.salesApplication.ethicalNote}</p></div>
              </div>
            </motion.div>
          )}</AnimatePresence>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
}

export function StrategiesTabContent({ analysisResult }: { analysisResult: { salesStrategies: { leverage: string[]; avoid: string[]; ethical_approach?: string }; detectedBiases: DetectedBias[] } }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border"><h4 className="font-medium mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-success" />Estratégias para Usar a Favor</h4><ul className="space-y-3">{analysisResult.salesStrategies.leverage.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm"><span className="text-success mt-0.5">→</span>{s}</li>)}</ul></div>
      <div className="p-4 rounded-lg border"><h4 className="font-medium mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-warning" />Estratégias para Contornar</h4><ul className="space-y-3">{analysisResult.salesStrategies.avoid.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm"><span className="text-warning mt-0.5">→</span>{s}</li>)}</ul></div>
      <div className="p-4 rounded-lg bg-info dark:bg-info/20 border border-info dark:border-info"><h4 className="font-medium mb-2 flex items-center gap-2 text-info dark:text-info"><AlertTriangle className="w-5 h-5" />Abordagem Ética</h4><p className="text-sm text-info dark:text-info">{analysisResult.salesStrategies.ethical_approach || 'Use o conhecimento de vieses para ajudar o cliente a tomar melhores decisões, não para manipulá-lo.'}</p></div>
      <div className="space-y-2"><h4 className="text-sm font-medium">Detecções Recentes</h4><div className="space-y-2">{analysisResult.detectedBiases.slice(0, 5).map(detection => (
        <div key={detection.id} className="p-3 rounded border text-sm">
          <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><span>{COGNITIVE_BIAS_INFO[detection.type].icon}</span><span className="font-medium">{COGNITIVE_BIAS_INFO[detection.type].namePt}</span></div><Badge variant="outline" className={cn('text-xs gap-1', getPolarityColor(detection.polarity))}>{getPolarityIcon(detection.polarity)}{detection.polarity === 'exploitable' ? 'Oportunidade' : detection.polarity === 'obstacle' ? 'Obstáculo' : 'Neutro'}</Badge></div>
          <p className="text-xs text-muted-foreground italic">"{detection.context}"</p>
        </div>
      ))}</div></div>
    </div>
  );
}

interface HistoryRecord {
  id: string; analyzedAt: string; dominantBiases: CognitiveBiasType[];
  categoryDistribution: Record<BiasCategory, number>; profileSummary?: string;
}

export function HistoryTabContent({ history, isLoading }: { history: HistoryRecord[]; isLoading: boolean }) {
  if (isLoading) return <div className="text-center py-8 text-muted-foreground"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" /><p>Carregando histórico...</p></div>;
  if (history.length === 0) return <div className="text-center py-8 text-muted-foreground"><History className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhuma análise salva ainda</p><p className="text-sm">As análises serão salvas automaticamente</p></div>;

  return (
    <ScrollArea className="h-[400px]"><div className="space-y-3">
      {history.map((record, index) => (
        <motion.div key={record.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><div className="text-2xl font-bold text-primary">{record.dominantBiases.length}</div><span className="text-sm text-muted-foreground">vieses detectados</span></div><div className="text-sm text-muted-foreground">{format(new Date(record.analyzedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div></div>
          <div className="flex flex-wrap gap-2 mb-3">{record.dominantBiases.slice(0, 5).map(biasType => { const info = COGNITIVE_BIAS_INFO[biasType]; return info ? <TooltipProvider key={biasType}><Tooltip><TooltipTrigger asChild><Badge variant="outline" className="gap-1"><span>{info.icon}</span>{info.namePt}</Badge></TooltipTrigger><TooltipContent><p>{info.descriptionPt}</p></TooltipContent></Tooltip></TooltipProvider> : null; })}{record.dominantBiases.length > 5 && <Badge variant="secondary">+{record.dominantBiases.length - 5}</Badge>}</div>
          <div className="grid grid-cols-5 gap-1">{(Object.entries(record.categoryDistribution) as [BiasCategory, number][]).map(([category, count]) => { const info = BIAS_CATEGORY_INFO[category]; return <TooltipProvider key={category}><Tooltip><TooltipTrigger asChild><div className={cn('text-center p-1 rounded text-xs', count > 0 ? info.color.replace('text-', 'bg-').replace('-600', '-100') : 'bg-muted/50')}><div>{info.icon}</div><div className="font-bold">{count}</div></div></TooltipTrigger><TooltipContent><p>{info.namePt}: {count} detecções</p></TooltipContent></Tooltip></TooltipProvider>; })}</div>
          {record.profileSummary && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{record.profileSummary}</p>}
        </motion.div>
      ))}
    </div></ScrollArea>
  );
}
