import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
  import { BookOpen, Zap, AlertTriangle, CheckCircle, Smile, Target, Brain, Waves, Activity, Sparkles, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
 import { useNeuromarketing } from '@/hooks/useNeuromarketing';
 import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnalysisResult {
  persuasionScore: number;
  clarityScore: number;
  emotionalScore: number;
  ctaStrength: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  emotionalProfile?: {
    joy: number;
    trust: number;
    fear: number;
    urgency: number;
    anticipation: number;
  };
  highlightedTriggers?: Array<{ text: string; category: string; startIndex: number; endIndex: number }>;
  readability: {
    fleschScore: number;
    level: string;
    recommendation: string;
    avgSentenceLength: number;
    avgWordLength: number;
    complexWordPercentage: number;
  };
  triggerDensity: {
    saturationLevel: string;
    triggersPerSentence: number;
    recommendation: string;
    dominantTriggers: string[];
    missingTriggers: string[];
  };
  issues: Array<{ issue: string; suggestion: string; severity: string }>;
  strengths: string[];
}

interface Props {
  analyzeText: string;
  onTextChange: (text: string) => void;
  analysisResult: AnalysisResult | null;
}

function getScoreColor(score: number) {
  if (score >= 60) return 'text-success';
  if (score >= 20) return 'text-warning';
  return 'text-destructive';
}

 export function CopywritingAnalyzerTab({ analyzeText, onTextChange, analysisResult }: Props) {
   const { analyzeText: analyzeNeuro } = useNeuromarketing();
 
   const neuroAnalysis = useMemo(() => {
     if (!analyzeText || analyzeText.length < 20) return null;
     return analyzeNeuro(analyzeText);
   }, [analyzeText, analyzeNeuro]);
 
   const neuroDominance = useMemo(() => {
     if (!neuroAnalysis) return null;
     const scores = neuroAnalysis.brainSystemScores;
     const dominant = neuroAnalysis.detectedBrainSystem;
     
     const labels: Record<string, string> = {
       reptilian: 'Reptiliano (Instintivo)',
       limbic: 'Límbico (Emocional)',
       neocortex: 'Neocórtex (Racional)'
     };
 
     return {
       label: labels[dominant],
       scores
     };
   }, [neuroAnalysis]);
 
           {/* Neuro-Análise Section */}
           {neuroAnalysis && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-xl p-4">
                 <h4 className="font-bold text-xs uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2">
                   <Brain className="h-4 w-4" /> Dominância Cerebral
                 </h4>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">{neuroDominance?.label}</span>
                     <Badge className="bg-indigo-500">{neuroAnalysis.confidence}% Confiança</Badge>
                   </div>
                   <div className="space-y-2">
                     {Object.entries(neuroAnalysis.brainSystemScores).map(([system, score]) => (
                       <div key={system} className="space-y-1">
                         <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                           <span>{system === 'reptilian' ? 'Sobrevivência' : system === 'limbic' ? 'Emoção' : 'Lógica'}</span>
                           <span>{score}%</span>
                         </div>
                         <Progress value={score} className={cn(
                           "h-1.5",
                           system === 'reptilian' ? "bg-red-100" : system === 'limbic' ? "bg-blue-100" : "bg-green-100"
                         )}>
                           <div 
                             className={cn(
                               "h-full transition-all",
                               system === 'reptilian' ? "bg-red-500" : system === 'limbic' ? "bg-blue-500" : "bg-green-500"
                             )} 
                             style={{ width: `${score}%` }} 
                           />
                         </Progress>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
 
               <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl p-4">
                 <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2">
                   <Waves className="h-4 w-4" /> Assinatura Neuroquímica
                 </h4>
                 <div className="grid grid-cols-2 gap-2">
                   {neuroAnalysis.neurochemicalProfile.map((neuro, idx) => (
                     <div key={idx} className="bg-white/50 border border-emerald-500/10 rounded-lg p-2 flex flex-col items-center text-center">
                       <Activity className="h-3 w-3 text-emerald-500 mb-1" />
                       <span className="text-[10px] font-bold uppercase">{neuro.chemical}</span>
                       <div className="text-lg font-black text-emerald-700">{neuro.intensity}%</div>
                       <span className="text-[9px] text-muted-foreground leading-tight">{neuro.indicators[0]}</span>
                     </div>
                   ))}
                   {neuroAnalysis.neurochemicalProfile.length === 0 && (
                     <div className="col-span-2 flex items-center justify-center h-full text-muted-foreground text-xs italic">
                       Nenhuma assinatura neuroquímica dominante detectada.
                     </div>
                   )}
                 </div>
               </div>
             </div>
           )}
 
           {/* Neuro-Recommendations */}
           {neuroAnalysis && neuroAnalysis.recommendations.length > 0 && (
             <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
               <h4 className="font-bold text-xs uppercase tracking-widest text-indigo-700 mb-3 flex items-center gap-2">
                 <Sparkles className="h-4 w-4" /> Sugestões de Otimização Neuro-Persuasiva
               </h4>
               <div className="flex flex-wrap gap-2">
                 {neuroAnalysis.recommendations.map((rec, idx) => (
                   <div key={idx} className="flex items-center gap-2 bg-white/80 border border-indigo-200 rounded-full px-3 py-1.5 text-xs text-indigo-900 font-medium">
                     <CheckCircle className="h-3 w-3 text-indigo-500" />
                     {rec}
                   </div>
                 ))}
               </div>
             </div>
           )}
 
  const renderHighlightedText = () => {
    if (!analysisResult?.highlightedTriggers || analysisResult.highlightedTriggers.length === 0) {
      return <p className="whitespace-pre-wrap">{analyzeText}</p>;
    }

    let lastIndex = 0;
    const elements = [];
    const text = analyzeText;

    analysisResult.highlightedTriggers.forEach((trigger, idx) => {
      if (trigger.startIndex > lastIndex) {
        elements.push(text.substring(lastIndex, trigger.startIndex));
      }
      
      elements.push(
        <span 
          key={idx} 
          className="bg-yellow-200 border-b-2 border-yellow-500 font-bold px-0.5 rounded-sm"
          title={trigger.category}
        >
          {text.substring(trigger.startIndex, trigger.endIndex)}
        </span>
      );
      
      lastIndex = trigger.endIndex;
    });

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{elements}</div>;
  };

  const getSentimentIcon = () => {
    switch(analysisResult?.sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-success" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Cole seu texto para análise:</label>
        <div className="relative group">
          <Textarea
            placeholder="Cole aqui o texto que deseja analisar (mínimo 20 caracteres)..."
            value={analyzeText}
            onChange={(e) => onTextChange(e.target.value)}
            className="min-h-[150px] border-primary/20 focus:border-primary transition-all pr-12 font-mono text-sm leading-relaxed"
          />
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onTextChange('')}
              title="Limpar texto"
            >
              <span className="text-[10px] font-bold">CLR</span>
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{analyzeText.length} caracteres</p>
      </div>

      {analysisResult && analysisResult.originalText.length > 0 && (
        <div className="space-y-4">
          {/* Highlighted Text Panel */}
          <div className="bg-white border rounded-xl p-6 shadow-inner overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-[10px] flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Visualização de Gatilhos
              </Badge>
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
              {renderHighlightedText()}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Persuasão', score: analysisResult.persuasionScore, icon: <Zap className="h-3 w-3" /> },
              { label: 'Clareza', score: analysisResult.clarityScore, icon: <BookOpen className="h-3 w-3" /> },
              { label: 'Emocional', score: analysisResult.emotionalScore, icon: <Smile className="h-3 w-3" /> },
              { label: 'CTA Strength', score: analysisResult.ctaStrength, icon: <Target className="h-3 w-3" /> },
            ].map(({ label, score, icon }) => (
              <div key={label} className="bg-gradient-to-br from-background to-muted/30 rounded-xl p-4 border border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-1 rounded bg-muted text-muted-foreground", getScoreColor(score).replace('text-', 'bg-').replace('success', 'success/20').replace('warning', 'warning/20').replace('destructive', 'destructive/20'))}>
                    {icon}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-2xl font-black", getScoreColor(score))}>{score}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">/100</span>
                </div>
                <Progress value={score} className="h-1 mt-2 bg-muted" />
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Legibilidade (Flesch PT-BR)
              </h4>
              <div className="flex items-center gap-4">
                <div className={cn("text-3xl font-bold", getScoreColor(analysisResult.readability.fleschScore))}>
                  {analysisResult.readability.fleschScore}
                </div>
                <div>
                  <Badge className={cn(
                    analysisResult.readability.level === 'muito_facil' || analysisResult.readability.level === 'facil' ? 'bg-success' :
                    analysisResult.readability.level === 'medio' ? 'bg-warning' :
                    analysisResult.readability.level === 'dificil' ? 'bg-accent' : 'bg-destructive'
                  )}>
                    {analysisResult.readability.level.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">{analysisResult.readability.recommendation}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-background rounded p-2">
                  <span className="font-medium">{analysisResult.readability.avgSentenceLength}</span>
                  <span className="text-muted-foreground ml-1">pal/frase</span>
                </div>
                <div className="bg-background rounded p-2">
                  <span className="font-medium">{analysisResult.readability.avgWordLength}</span>
                  <span className="text-muted-foreground ml-1">let/pal</span>
                </div>
                <div className="bg-background rounded p-2">
                  <span className="font-medium">{analysisResult.readability.complexWordPercentage}%</span>
                  <span className="text-muted-foreground ml-1">complexas</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Sentimento & Emoção
                </div>
                <Badge variant="outline" className="capitalize flex items-center gap-1">
                  {getSentimentIcon()} {analysisResult.sentiment}
                </Badge>
              </h4>
              
              {analysisResult.emotionalProfile && (
                <div className="space-y-2 mt-2">
                  {Object.entries(analysisResult.emotionalProfile).map(([emotion, value]) => (
                    <div key={emotion} className="space-y-1">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                        <span>{emotion === 'joy' ? 'Alegria' : emotion === 'trust' ? 'Confiança' : emotion === 'fear' ? 'Medo' : emotion === 'urgency' ? 'Urgência' : 'Antecipação'}</span>
                        <span>{value}%</span>
                      </div>
                      <Progress value={value} className="h-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trigger Density */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Densidade de Gatilhos
            </h4>
            <div className="flex items-center gap-4 mb-3">
              <Badge className={cn(
                analysisResult.triggerDensity.saturationLevel === 'optimal' ? 'bg-success' :
                analysisResult.triggerDensity.saturationLevel === 'low' ? 'bg-warning' : 'bg-destructive'
              )}>
                {analysisResult.triggerDensity.saturationLevel === 'optimal' ? 'ÓTIMO' :
                 analysisResult.triggerDensity.saturationLevel === 'low' ? 'BAIXO' : 'ALTO'}
              </Badge>
              <span className="text-sm">{analysisResult.triggerDensity.triggersPerSentence} gatilhos/frase</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{analysisResult.triggerDensity.recommendation}</p>
            {analysisResult.triggerDensity.dominantTriggers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-muted-foreground">Presentes:</span>
                {analysisResult.triggerDensity.dominantTriggers.map(t => (
                  <Badge key={t} variant="secondary" className="text-xs bg-success/20 text-success">{t}</Badge>
                ))}
              </div>
            )}
            {analysisResult.triggerDensity.missingTriggers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Faltando:</span>
                {analysisResult.triggerDensity.missingTriggers.slice(0, 4).map(t => (
                  <Badge key={t} variant="outline" className="text-xs border-destructive/30 text-destructive">{t}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Issues & Strengths */}
          <div className="grid md:grid-cols-2 gap-4">
            {analysisResult.issues.length > 0 && (
              <div className="bg-destructive/10 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pontos a Melhorar
                </h4>
                <ul className="space-y-2">
                  {analysisResult.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm">
                      <span className={cn(
                        "font-medium",
                        issue.severity === 'high' ? 'text-destructive' : 'text-warning'
                      )}>
                        {issue.issue}
                      </span>
                      <p className="text-xs text-muted-foreground">{issue.suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysisResult.strengths.length > 0 && (
              <div className="bg-success/10 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-success flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Pontos Fortes
                </h4>
                <ul className="space-y-1">
                  {analysisResult.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
