import { useState, useEffect, useRef } from 'react';
import { Brain, BarChart3, Target, History, Info, Save, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCognitiveBiases } from '@/hooks/useCognitiveBiases';
import { useCognitiveBiasPersistence } from '@/hooks/useCognitiveBiasPersistence';
import { CognitiveBiasType, BiasCategory } from '@/types/cognitive-biases';
import { COGNITIVE_BIAS_INFO, BIAS_CATEGORY_INFO } from '@/data/cognitiveBiasesData';
import { Contact } from '@/types';
import { BiasCard, StrategiesTabContent, HistoryTabContent } from './cognitive-biases/CognitiveBiasesSubComponents';

interface Interaction { id: string; content?: string; transcription?: string; createdAt?: string; }

interface CognitiveBiasesPanelProps { contact: Contact; interactions: Interaction[]; className?: string; }

export function CognitiveBiasesPanel({ contact, interactions, className }: CognitiveBiasesPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'biases' | 'strategies' | 'history'>('overview');
  const [expandedBias, setExpandedBias] = useState<CognitiveBiasType | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const lastInteractionCountRef = useRef(interactions.length);

  const { analysisResult } = useCognitiveBiases(contact, interactions);
  const { history, isLoading: isLoadingHistory, saveAnalysis, isSaving, evolutionData } = useCognitiveBiasPersistence(contact.id);

  useEffect(() => {
    if (analysisResult && interactions.length > 0 && interactions.length !== lastInteractionCountRef.current) {
      lastInteractionCountRef.current = interactions.length;
      saveAnalysis(analysisResult);
      setAutoSaved(true);
      const timer = setTimeout(() => setAutoSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [interactions.length, analysisResult, saveAnalysis]);

  if (!analysisResult || interactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" />Vieses Cognitivos</CardTitle><CardDescription>Detecção de padrões de pensamento</CardDescription></CardHeader>
        <CardContent><div className="text-center py-8 text-muted-foreground"><Brain className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Sem interações suficientes para análise</p><p className="text-sm">Adicione interações para detectar vieses cognitivos</p></div></CardContent>
      </Card>
    );
  }

  const totalBiases = analysisResult.detectedBiases.length;
  const uniqueBiases = analysisResult.biasProfile.dominantBiases.length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />Vieses Cognitivos
              {autoSaved && <Badge variant="outline" className="text-xs gap-1 text-success border-success"><CheckCircle2 className="w-3 h-3" />Salvo</Badge>}
              {isSaving && <Badge variant="outline" className="text-xs gap-1"><Save className="w-3 h-3 animate-pulse" />Salvando...</Badge>}
            </CardTitle>
            <CardDescription>Padrões de pensamento detectados{history.length > 0 && <span className="ml-2 text-xs">• {history.length} análise{history.length > 1 ? 's' : ''} salva{history.length > 1 ? 's' : ''}</span>}</CardDescription>
          </div>
          <TooltipProvider><Tooltip><TooltipTrigger asChild><div className="flex flex-col items-end"><div className="text-2xl font-bold text-primary">{uniqueBiases}</div><span className="text-xs text-muted-foreground">vieses únicos</span></div></TooltipTrigger><TooltipContent><p>{totalBiases} detecções em {interactions.length} interações</p>{evolutionData && evolutionData.mostFrequentBiases.length > 0 && <p className="text-xs text-muted-foreground">Mais frequente: {COGNITIVE_BIAS_INFO[evolutionData.mostFrequentBiases[0].bias]?.namePt}</p>}</TooltipContent></Tooltip></TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-1"><BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Visão Geral</span></TabsTrigger>
            <TabsTrigger value="biases" className="gap-1"><Brain className="w-4 h-4" /><span className="hidden sm:inline">Vieses</span></TabsTrigger>
            <TabsTrigger value="strategies" className="gap-1"><Target className="w-4 h-4" /><span className="hidden sm:inline">Estratégias</span></TabsTrigger>
            <TabsTrigger value="history" className="gap-1"><History className="w-4 h-4" /><span className="hidden sm:inline">Histórico</span></TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {evolutionData && evolutionData.mostFrequentBiases.length > 0 && (
              <div className="p-3 rounded-lg border bg-secondary dark:bg-secondary/20">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-secondary" /><h4 className="text-sm font-medium text-secondary dark:text-secondary">Vieses Mais Frequentes (Histórico)</h4></div>
                <div className="flex flex-wrap gap-2">{evolutionData.mostFrequentBiases.slice(0, 4).map(({ bias, count }) => { const info = COGNITIVE_BIAS_INFO[bias]; return <Badge key={bias} variant="outline" className="gap-1"><span>{info?.icon}</span>{info?.namePt} ({count}x)</Badge>; })}</div>
              </div>
            )}
            <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm">{analysisResult.profileSummary}</p></div>
            <div className="space-y-3"><h4 className="text-sm font-medium">Distribuição por Categoria</h4>
              {(Object.entries(analysisResult.biasProfile.categoryDistribution) as [BiasCategory, number][]).filter(([_, count]) => count > 0).sort((a, b) => b[1] - a[1]).map(([category, count]) => {
                const info = BIAS_CATEGORY_INFO[category]; const maxCount = Math.max(...Object.values(analysisResult.biasProfile.categoryDistribution));
                return (<div key={category} className="flex items-center gap-3"><span className="text-lg w-8">{info.icon}</span><div className="flex-1"><div className="flex items-center justify-between mb-1"><span className="text-sm">{info.namePt}</span><span className="text-sm font-medium">{count}</span></div><Progress value={maxCount > 0 ? (count / maxCount) * 100 : 0} className="h-2" /></div></div>);
              })}
            </div>
            <div className="space-y-2"><h4 className="text-sm font-medium">Vieses Dominantes</h4><div className="flex flex-wrap gap-2">{analysisResult.biasProfile.dominantBiases.map(bias => { const info = COGNITIVE_BIAS_INFO[bias]; return <Badge key={bias} variant="outline" className={cn('gap-1.5', info.bgColor, info.color)}><span>{info.icon}</span>{info.namePt}</Badge>; })}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-success dark:bg-success/20"><h4 className="text-sm font-medium text-success dark:text-success mb-2">⚡ Oportunidades</h4><ul className="text-xs space-y-1">{analysisResult.vulnerabilities.slice(0, 3).map(v => <li key={v.bias} className="flex items-center gap-1"><span>{COGNITIVE_BIAS_INFO[v.bias].icon}</span>{COGNITIVE_BIAS_INFO[v.bias].namePt}</li>)}</ul></div>
              <div className="p-3 rounded-lg border bg-destructive dark:bg-destructive/20"><h4 className="text-sm font-medium text-destructive dark:text-destructive mb-2">🛡️ Resistências</h4><ul className="text-xs space-y-1">{analysisResult.resistances.slice(0, 3).map(r => <li key={r.bias} className="flex items-center gap-1"><span>{COGNITIVE_BIAS_INFO[r.bias].icon}</span>{COGNITIVE_BIAS_INFO[r.bias].namePt}</li>)}</ul></div>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t"><span className="text-muted-foreground flex items-center gap-1"><Info className="w-4 h-4" />Cobertura de evidências</span><span>{analysisResult.evidenceCoverage}%</span></div>
          </TabsContent>

          <TabsContent value="biases" className="mt-4">
            <ScrollArea className="h-[500px] pr-4"><div className="space-y-3">
              {analysisResult.biasProfile.dominantBiases.map(bias => <BiasCard key={bias} biasType={bias} count={analysisResult.biasProfile.biasFrequency[bias]} isExpanded={expandedBias === bias} onToggle={() => setExpandedBias(expandedBias === bias ? null : bias)} />)}
              {analysisResult.biasProfile.dominantBiases.length === 0 && <div className="text-center py-8 text-muted-foreground"><p>Nenhum viés detectado ainda</p><p className="text-sm">Continue registrando interações</p></div>}
            </div></ScrollArea>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4 mt-4"><StrategiesTabContent analysisResult={analysisResult} /></TabsContent>
          <TabsContent value="history" className="space-y-4 mt-4"><HistoryTabContent history={history} isLoading={isLoadingHistory} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
