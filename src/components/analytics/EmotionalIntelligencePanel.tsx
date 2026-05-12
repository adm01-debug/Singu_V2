 import { useState } from 'react';
 import { Brain, Target, ShieldCheck, Heart, Users, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { cn } from '@/lib/utils';
 import { useEmotionalIntelligence } from '@/hooks/useEmotionalIntelligence';
 import { Contact } from '@/types';
 import { EQPillar } from '@/types/emotional-intelligence';
 
 interface Interaction { id: string; content?: string; transcription?: string; createdAt?: string; }
 interface EQPanelProps { contact: Contact; interactions: Interaction[]; className?: string; }
 
 export function EmotionalIntelligencePanel({ contact, interactions, className }: EQPanelProps) {
   const { analysisResult, EQ_PILLAR_INFO } = useEmotionalIntelligence(contact, interactions);
   const [activeTab, setActiveTab] = useState<'overview' | 'pillars' | 'sales'>('overview');
 
   if (!analysisResult || interactions.length === 0) {
     return (
       <Card className={className}>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Brain className="w-5 h-5 text-primary" />
             Inteligência Emocional
           </CardTitle>
           <CardDescription>Análise de competências emocionais</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="text-center py-8 text-muted-foreground">
             <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
             <p>Sem interações suficientes para análise EQ</p>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   const getLevelBadge = (level: string) => {
     const configs: Record<string, { label: string, color: string }> = {
       low: { label: 'Iniciante', color: 'bg-destructive/10 text-destructive border-destructive/20' },
       developing: { label: 'Em Desenvolvimento', color: 'bg-warning/10 text-warning border-warning/20' },
       moderate: { label: 'Moderado', color: 'bg-info/10 text-info border-info/20' },
       high: { label: 'Alto', color: 'bg-success/10 text-success border-success/20' },
       exceptional: { label: 'Excepcional', color: 'bg-primary/10 text-primary border-primary/20' },
     };
     const cfg = configs[level] || configs.moderate;
     return <Badge variant="outline" className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</Badge>;
   };
 
   const pillarIcons: Record<EQPillar, any> = {
     self_awareness: Target,
     self_regulation: ShieldCheck,
     motivation: TrendingUp,
     empathy: Heart,
     social_skills: Users,
   };
 
   return (
     <Card className={className}>
       <CardHeader>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <Brain className="w-5 h-5 text-primary" />
               Inteligência Emocional
             </CardTitle>
             <CardDescription>
               Baseado em {analysisResult.indicators.length} indicadores detectados
             </CardDescription>
           </div>
           <div className="text-right">
             <div className="text-2xl font-bold">{analysisResult.overallScore}%</div>
             {getLevelBadge(analysisResult.overallLevel)}
           </div>
         </div>
       </CardHeader>
       <CardContent>
         <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
           <TabsList className="grid w-full grid-cols-3">
             <TabsTrigger value="overview">Visão Geral</TabsTrigger>
             <TabsTrigger value="pillars">Pilares</TabsTrigger>
             <TabsTrigger value="sales">Vendas</TabsTrigger>
           </TabsList>
 
           <TabsContent value="overview" className="space-y-4 mt-4">
             <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
               <p className="text-sm italic leading-relaxed text-foreground/80">
                 "{analysisResult.profileSummary}"
               </p>
             </div>
 
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Principais Forças</h4>
                 <div className="flex flex-wrap gap-2">
                   {analysisResult.strengths.map(p => (
                     <Badge key={p} variant="secondary" className="gap-1.5 py-1">
                       <ShieldCheck className="w-3 h-3 text-success" />
                       {EQ_PILLAR_INFO[p].namePt}
                     </Badge>
                   ))}
                 </div>
               </div>
               <div className="space-y-2">
                 <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Oportunidades de Conexão</h4>
                 <div className="flex flex-wrap gap-2">
                   {analysisResult.areasForGrowth.map(p => (
                     <Badge key={p} variant="outline" className="gap-1.5 py-1 border-dashed">
                       <Target className="w-3 h-3 text-primary" />
                       {EQ_PILLAR_INFO[p].namePt}
                     </Badge>
                   ))}
                 </div>
               </div>
             </div>
 
             <div className="pt-2 border-t">
               <div className="flex items-center justify-between text-xs text-muted-foreground">
                 <div className="flex items-center gap-1">
                   <Info className="w-3 h-3" />
                   Confiança da análise
                 </div>
                 <span>{analysisResult.confidence}%</span>
               </div>
               <Progress value={analysisResult.confidence} className="h-1 mt-1" />
             </div>
           </TabsContent>
 
           <TabsContent value="pillars" className="space-y-4 mt-4">
             {Object.entries(analysisResult.pillarScores).map(([pillar, score]) => {
               const Icon = pillarIcons[pillar as EQPillar];
               const info = EQ_PILLAR_INFO[pillar as EQPillar];
               return (
                 <div key={pillar} className="space-y-2">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                         <Icon className="w-4 h-4" />
                       </div>
                       <span className="text-sm font-medium">{info.namePt}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-bold">{score.score}%</span>
                       {score.trend === 'improving' ? <TrendingUp className="w-3 h-3 text-success" /> : 
                        score.trend === 'declining' ? <TrendingDown className="w-3 h-3 text-destructive" /> : 
                        <Minus className="w-3 h-3 text-muted-foreground" />}
                     </div>
                   </div>
                   <Progress value={score.score} className="h-2" />
                   <p className="text-[10px] text-muted-foreground line-clamp-1">{score.insights[0]}</p>
                 </div>
               );
             })}
           </TabsContent>
 
           <TabsContent value="sales" className="space-y-4 mt-4">
             <div className="grid grid-cols-1 gap-3">
               <div className="p-3 rounded-lg border bg-primary/5 border-primary/10">
                 <h4 className="text-sm font-bold text-primary mb-1">Estratégia de Persuasão</h4>
                 <p className="text-xs text-muted-foreground">{analysisResult.salesImplications.persuasionApproach}</p>
               </div>
               <div className="p-3 rounded-lg border bg-info/5 border-info/10">
                 <h4 className="text-sm font-bold text-info mb-1">Estilo de Decisão</h4>
                 <p className="text-xs text-muted-foreground">{analysisResult.salesImplications.decisionMakingStyle}</p>
               </div>
               <div className="p-3 rounded-lg border bg-warning/5 border-warning/10">
                 <h4 className="text-sm font-bold text-warning mb-1">Tratamento de Objeções</h4>
                 <p className="text-xs text-muted-foreground">{analysisResult.salesImplications.objectionHandling}</p>
               </div>
               <div className="p-3 rounded-lg border bg-success/5 border-success/10">
                 <h4 className="text-sm font-bold text-success mb-1">Fechamento Recomendado</h4>
                 <p className="text-xs text-muted-foreground">{analysisResult.salesImplications.closingStrategy}</p>
               </div>
             </div>
           </TabsContent>
         </Tabs>
       </CardContent>
     </Card>
   );
 }