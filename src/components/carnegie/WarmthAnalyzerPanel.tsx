// ==============================================
// WARMTH ANALYZER PANEL
// Real-time warmth score analysis
// ==============================================

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Thermometer, 
  Sun, 
  Snowflake, 
  Flame,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Check,
  X,
  Plus
} from 'lucide-react';
import { WarmthScore } from '@/types/carnegie';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { PromptChips } from '@/components/ui/prompt-chips';


interface WarmthAnalyzerPanelProps {
  contact?: Contact | null;
  initialText?: string;
  onAnalysisComplete?: (score: WarmthScore) => void;
  className?: string;
}

const WARMTH_LEVELS = {
  cold: { icon: Snowflake, label: 'Frio', color: 'text-info', bg: 'bg-info/10' },
  neutral: { icon: Thermometer, label: 'Neutro', color: 'text-muted-foreground', bg: 'bg-muted' },
  warm: { icon: Sun, label: 'Caloroso', color: 'text-warning', bg: 'bg-warning/10' },
  very_warm: { icon: Flame, label: 'Muito Caloroso', color: 'text-accent', bg: 'bg-accent/10' },
  exceptional: { icon: Flame, label: 'Excepcional', color: 'text-success', bg: 'bg-success/10' }
};

export function WarmthAnalyzerPanel({ 
  contact = null, 
  initialText = '',
  onAnalysisComplete,
  className 
}: WarmthAnalyzerPanelProps) {
  const [text, setText] = useState(initialText);
  const [warmthScore, setWarmthScore] = useState<WarmthScore | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { analyzeWarmth } = useCarnegieAnalysis(contact);

  const handleAnalyze = useCallback(() => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate slight delay for UX
    setTimeout(() => {
      const score = analyzeWarmth(text);
      setWarmthScore(score);
      onAnalysisComplete?.(score);
      setIsAnalyzing(false);
    }, 300);
  }, [text, analyzeWarmth, onAnalysisComplete]);

  const levelConfig = warmthScore ? WARMTH_LEVELS[warmthScore.level] : null;
  const LevelIcon = levelConfig?.icon || Thermometer;

  const getComponentColor = (value: number) => {
    if (value >= 80) return 'bg-success';
    if (value >= 60) return 'bg-primary';
    if (value >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Thermometer className="h-5 w-5 text-accent" />
          Analisador de Calor Humano
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Text Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Cole aqui o texto da mensagem para analisar o nível de calor humano..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={!text.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Thermometer className="h-4 w-4 mr-2" />
                Analisar Calor
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {warmthScore && (
          <div className="space-y-4 pt-4 border-t">
            {/* Overall Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", levelConfig?.bg)}>
                  <LevelIcon className={cn("h-6 w-6", levelConfig?.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{warmthScore.overall}%</p>
                  <p className={cn("text-sm font-medium", levelConfig?.color)}>
                    {levelConfig?.label}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={cn(levelConfig?.bg, levelConfig?.color)}>
                {warmthScore.trend === 'improving' ? '↗ Melhorando' : 
                 warmthScore.trend === 'declining' ? '↘ Declinando' : '→ Estável'}
              </Badge>
            </div>

            {/* Component Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Componentes</h4>
              <div className="grid gap-2">
                {[
                  { key: 'greetingWarmth', label: 'Saudação Calorosa' },
                  { key: 'empathyIndicators', label: 'Indicadores de Empatia' },
                  { key: 'positiveLanguage', label: 'Linguagem Positiva' },
                  { key: 'personalTouches', label: 'Toques Pessoais' },
                  { key: 'emotionalConnection', label: 'Conexão Emocional' },
                  { key: 'genuineInterest', label: 'Interesse Genuíno' }
                ].map(({ key, label }) => {
                  const value = warmthScore.components[key as keyof typeof warmthScore.components];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-36 truncate">{label}</span>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", getComponentColor(value))}
                          style={{ width: `${Math.min(value, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warmth Indicators */}
            {warmthScore.warmthIndicators.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-success flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Elementos Positivos Detectados
                </h4>
                <div className="flex flex-wrap gap-1">
                  {warmthScore.warmthIndicators.slice(0, 6).map((indicator, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-success/10 text-success border-success/20"
                    >
                      "{indicator.phrase}"
                    </Badge>
                  ))}
                  {warmthScore.warmthIndicators.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{warmthScore.warmthIndicators.length - 6} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Cold Indicators */}
            {warmthScore.coldIndicators.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Elementos a Melhorar
                </h4>
                <div className="space-y-2">
                  {warmthScore.coldIndicators.slice(0, 3).map((indicator, idx) => (
                    <div 
                      key={idx}
                      className="p-2 rounded bg-destructive/5 border border-destructive/20"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <span className="text-destructive line-through">"{indicator.phrase}"</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="text-success">"{indicator.alternative}"</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {warmthScore.improvementSuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-1 text-warning">
                  <Lightbulb className="h-3 w-3" />
                  Aplicar Melhorias Rápidas
                </h4>
                <PromptChips 
                  chips={warmthScore.improvementSuggestions.slice(0, 4).map((s, i) => ({
                    id: `warmth-${i}`,
                    label: s.area,
                    icon: <Plus className="h-3 w-3 mr-1.5" />,
                    color: "hover:border-warning/40 hover:bg-warning/5 hover:text-warning"
                  }))}
                  onSelect={(label) => {
                    const sugg = warmthScore.improvementSuggestions.find(s => s.area === label);
                    if (sugg?.template) {
                      setText(prev => prev ? `${prev}\n\n${sugg.template}` : sugg.template);
                    }
                  }}
                />
                <div className="grid gap-2 mt-2">
                  {warmthScore.improvementSuggestions.slice(0, 2).map((suggestion, idx) => (
                    <div 
                      key={idx}
                      className="p-2 rounded bg-warning/5 border border-warning/20"
                    >
                      <p className="text-[11px] text-muted-foreground">{suggestion.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
