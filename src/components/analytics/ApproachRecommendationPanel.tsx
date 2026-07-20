import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles, Shield, Layers, MessageCircle, Phone, Zap, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useApproachRecommendation } from '@/hooks/useApproachRecommendation';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { useEmotionalIntelligence } from '@/hooks/useEmotionalIntelligence';
import { useCognitiveBiases } from '@/hooks/useCognitiveBiases';
import { useEmotionalStates } from '@/hooks/useEmotionalStates';
import { useClientValues } from '@/hooks/useClientValues';
import { useHiddenObjections } from '@/hooks/useHiddenObjections';
import { useRapportGenerator } from '@/hooks/useRapportGenerator';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { Contact } from '@/types';
import { VAKProfile } from '@/types/vak';
import { MetaprogramProfile } from '@/types/metaprograms';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { PhaseCard, MessagesTab, ChannelsTab, TechniquesTab, TipsTab } from './approach/ApproachSubComponents';

interface ApproachRecommendationPanelProps {
  contact: Contact;
  interactions: Array<{ id: string; content?: string; transcription?: string; createdAt?: string }>;
  className?: string;
}

const riskColors = { low: 'text-success bg-success/10 border-success/30', medium: 'text-warning bg-warning/10 border-warning/30', high: 'text-destructive bg-destructive/10 border-destructive/30' };
const riskLabels = { low: 'Baixo Risco', medium: 'Risco Moderado', high: 'Alto Risco' };

export function ApproachRecommendationPanel({ contact, interactions, className }: ApproachRecommendationPanelProps) {
  const [activeTab, setActiveTab] = useState('strategy');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['rapport']));
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [vakProfile, setVakProfile] = useState<VAKProfile | null>(null);
  const [metaprogramProfile, setMetaprogramProfile] = useState<MetaprogramProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { getContactVAKProfile } = useVAKAnalysis();
  const { getContactMetaprogramProfile } = useMetaprogramAnalysis();
  const { analysisResult: eqResult } = useEmotionalIntelligence(contact, interactions);
  const { analysisResult: biasResult } = useCognitiveBiases(contact, interactions);
  const { analyzeEmotionalHistory } = useEmotionalStates();
  const { valuesMap } = useClientValues(contact, interactions);
  const { objectionAnalysis } = useHiddenObjections(interactions);
  const { rapportProfile } = useRapportGenerator(contact);
  const { analysis: triggerAnalysis } = useClientTriggers(contact);

  const emotionalAnalysis = useMemo(() => analyzeEmotionalHistory(interactions), [analyzeEmotionalHistory, interactions]);
  const currentEmotionalState = emotionalAnalysis?.currentState || null;
  const topValues = valuesMap?.coreValues || [];
  const rawObjections = objectionAnalysis?.detectedObjections || [];
  const hiddenObjections = rawObjections.map(obj => ({ objection_type: obj.type || 'unknown', indicator: obj.indicator || '', suggested_probe: obj.suggestedProbe }));
  const rapportScore = rapportProfile?.rapportScore || 0;
  const activeTriggers = triggerAnalysis?.primaryTriggers || [];

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const [vak, meta] = await Promise.all([getContactVAKProfile(contact.id), getContactMetaprogramProfile(contact.id)]);
        setVakProfile(vak);
        setMetaprogramProfile(meta);
      } catch (error) { 
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching profiles:', { error: msg }); 
      }
      finally { setLoading(false); }
    };
    fetchProfiles();
  }, [contact.id, getContactVAKProfile, getContactMetaprogramProfile]);

  const recommendation = useApproachRecommendation({ contact, vakProfile, metaprogramProfile, eqResult, biasResult, emotionalState: currentEmotionalState, topValues, activeTriggers, hiddenObjections, rapportScore });

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => { const next = new Set(prev); if (next.has(phaseId)) { next.delete(phaseId); } else { next.add(phaseId); } return next; });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' });
  };

  if (loading) {
    return (<Card className={cn('animate-pulse', className)}><CardHeader><div className="h-6 bg-muted rounded w-1/3" /></CardHeader><CardContent><div className="space-y-4"><div className="h-20 bg-muted rounded" /><div className="h-40 bg-muted rounded" /></div></CardContent></Card>);
  }

  const { overallStrategy, phases, channels, personalizedMessages, doAndDont, objectionHandling, closingTechniques, urgencyTriggers, trustBuilders, decisionAccelerators, keyMetrics } = recommendation;

  return (
    <TooltipProvider>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20"><Target className="w-5 h-5 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">Recomendação de Abordagem<Badge variant="outline" className="ml-2"><Sparkles className="w-3 h-3 mr-1" />IA</Badge></CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Estratégia personalizada baseada em 10 frameworks comportamentais</p>
              </div>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-card border shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-primary-foreground">{overallStrategy.name}</Badge>
                  <Badge variant="outline" className={cn('border', riskColors[overallStrategy.riskLevel])}><Shield className="w-3 h-3 mr-1" />{riskLabels[overallStrategy.riskLevel]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{overallStrategy.description}</p>
              </div>
              <div className="text-right space-y-1"><div className="text-2xl font-bold text-primary">{overallStrategy.estimatedSuccessRate}%</div><p className="text-xs text-muted-foreground">Taxa de sucesso estimada</p></div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
              {keyMetrics.map((metric, idx) => (<div key={idx} className="text-center"><div className="text-lg font-semibold">{metric.value}</div><div className="text-xs text-muted-foreground">{metric.name}</div><Badge variant="secondary" className="text-[10px] mt-1">{metric.impact}</Badge></div>))}
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full rounded-none border-b bg-muted/30 p-0 h-auto">
              <TabsTrigger value="strategy" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"><Layers className="w-4 h-4 mr-2" />Fases</TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"><MessageCircle className="w-4 h-4 mr-2" />Mensagens</TabsTrigger>
              <TabsTrigger value="channels" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"><Phone className="w-4 h-4 mr-2" />Canais</TabsTrigger>
              <TabsTrigger value="techniques" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"><Zap className="w-4 h-4 mr-2" />Técnicas</TabsTrigger>
              <TabsTrigger value="tips" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"><Lightbulb className="w-4 h-4 mr-2" />Dicas</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[500px]">
              <TabsContent value="strategy" className="p-4 mt-0 space-y-3">
                {phases.map((phase, idx) => (<PhaseCard key={phase.id} phase={phase} index={idx} isExpanded={expandedPhases.has(phase.id)} onToggle={() => togglePhase(phase.id)} onCopy={(text: string) => copyToClipboard(text, `phase-${phase.id}`)} copiedItem={copiedItem} />))}
              </TabsContent>
              <TabsContent value="messages" className="p-4 mt-0"><MessagesTab personalizedMessages={personalizedMessages} objectionHandling={objectionHandling} copyToClipboard={copyToClipboard} copiedItem={copiedItem} /></TabsContent>
              <TabsContent value="channels" className="p-4 mt-0"><ChannelsTab channels={channels} /></TabsContent>
              <TabsContent value="techniques" className="p-4 mt-0"><TechniquesTab closingTechniques={closingTechniques} urgencyTriggers={urgencyTriggers} trustBuilders={trustBuilders} decisionAccelerators={decisionAccelerators} copyToClipboard={copyToClipboard} copiedItem={copiedItem} /></TabsContent>
              <TabsContent value="tips" className="p-4 mt-0"><TipsTab doAndDont={doAndDont} overallStrategy={overallStrategy} channels={channels} closingTechniques={closingTechniques} /></TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
