// ==============================================
// TALK RATIO ANALYZER PANEL
// Listen more than you speak
// ==============================================

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare,
  Ear,
  HelpCircle,
  MessageCircle,
  RefreshCw,
  Target,
  TrendingUp,
  AlertTriangle,
  Check
} from 'lucide-react';
import { TalkRatioAnalysis } from '@/types/carnegie';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';

interface TalkRatioPanelProps {
  contact?: Contact | null;
  className?: string;
}

const QUALITY_CONFIG = {
  excellent: { label: 'Excelente', color: 'text-success', bg: 'bg-success/10' },
  good: { label: 'Bom', color: 'text-primary', bg: 'bg-primary/10' },
  needs_improvement: { label: 'Precisa Melhorar', color: 'text-warning', bg: 'bg-warning/10' },
  poor: { label: 'Crítico', color: 'text-destructive', bg: 'bg-destructive/10' }
};

export function TalkRatioPanel({ contact = null, className }: TalkRatioPanelProps) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<TalkRatioAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { analyzeTalkRatio } = useCarnegieAnalysis(contact);

  const handleAnalyze = useCallback(() => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = analyzeTalkRatio(text, true);
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 300);
  }, [text, analyzeTalkRatio]);

  const qualityConfig = analysis ? QUALITY_CONFIG[analysis.quality] : null;

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Analisador de Proporção Fala/Escuta
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          "Seja um bom ouvinte. Encoraje outros a falar sobre si mesmos." - Dale Carnegie
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Cole aqui sua mensagem ou transcrição de conversa para analisar a proporção fala/escuta..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[80px] resize-none"
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
                <MessageSquare className="h-4 w-4 mr-2" />
                Analisar Proporção
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-4 pt-4 border-t">
            {/* Quality Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Qualidade da Conversa</span>
              <Badge className={cn(qualityConfig?.bg, qualityConfig?.color)}>
                {qualityConfig?.label}
              </Badge>
            </div>

            {/* Talk/Listen Ratio Visualization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>Você Falou</span>
                </div>
                <span className="font-medium">{analysis.speakerRatio}%</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    analysis.speakerRatio > 50 ? "bg-warning" : "bg-success"
                  )}
                  style={{ width: `${analysis.speakerRatio}%` }}
                />
                <div 
                  className="h-full bg-primary/20"
                  style={{ width: `${analysis.listenerRatio}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Ear className="h-4 w-4 text-muted-foreground" />
                  <span>Você Ouviu</span>
                </div>
                <span className="font-medium">{analysis.listenerRatio}%</span>
              </div>
            </div>

            {/* Ideal Ratio Indicator */}
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
              <Target className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Proporção Ideal: {analysis.idealRatio}% fala</p>
                <p className="text-xs text-muted-foreground">
                  Desvio atual: {analysis.deviation}% {analysis.deviation > 0 ? 'acima' : 'abaixo'} do ideal
                </p>
              </div>
              {analysis.deviation <= 10 ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Perguntas</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{analysis.questionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Abertas:</span>
                    <span className="font-medium text-success">{analysis.openEndedQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fechadas:</span>
                    <span className="font-medium">{analysis.closedQuestions}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Escuta Ativa</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reflexivas:</span>
                    <span className="font-medium">{analysis.reflectiveStatements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validações:</span>
                    <span className="font-medium">{analysis.acknowledgments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Indicadores:</span>
                    <span className="font-medium text-success">{analysis.activeListeningIndicators}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Recomendações
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className="p-2 rounded bg-primary/5 border border-primary/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs">{rec.suggestion}</p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs shrink-0",
                            rec.priority === 'high' ? 'border-destructive text-destructive' :
                            rec.priority === 'medium' ? 'border-warning text-warning' :
                            'border-muted-foreground'
                          )}
                        >
                          {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      {rec.template && (
                        <p className="text-xs italic text-muted-foreground mt-1">
                          Exemplo: "{rec.template}"
                        </p>
                      )}
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
