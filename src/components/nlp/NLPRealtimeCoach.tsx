import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  MessageSquare, 
  RefreshCcw, 
  Copy, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown,
  ArrowRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { VAK_LABELS, VAK_COMMUNICATION_TIPS, type VAKType } from '@/types/vak';
import { METAPROGRAM_LABELS } from '@/types/metaprograms';
import { SLEIGHT_TEMPLATES } from '@/data/sleightOfMouth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Suggestion {
  id: string;
  type: 'rapport' | 'reframing' | 'vak' | 'metaprogram';
  text: string;
  fullContent?: string;
  icon: React.ReactNode;
  color: string;
}

interface Props {
  content: string;
  contactId?: string;
  onApplySuggestion?: (text: string) => void;
}

export function NLPRealtimeCoach({ content, contactId, onApplySuggestion }: Props) {
  const { user } = useAuth();
  const { analyzeText: analyzeVAK } = useVAKAnalysis();
  const { analyzeText: analyzeMeta } = useMetaprogramAnalysis();
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [detectedVAK, setDetectedVAK] = useState<any>(null);
  const [detectedMeta, setDetectedMeta] = useState<any>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  
  useEffect(() => {
    if (content.length > 15) {
      const vak = analyzeVAK(content);
      const meta = analyzeMeta(content);
      setDetectedVAK(vak);
      setDetectedMeta(meta);
      
      const newSuggestions: Suggestion[] = [];

      // 1. VAK Proactive Suggestions
      if (vak.dominantSystem) {
        const tips = VAK_COMMUNICATION_TIPS[vak.dominantSystem as VAKType];
        newSuggestions.push({
          id: `vak-${vak.dominantSystem}`,
          type: 'vak',
          text: `Tom de voz ${VAK_LABELS[vak.dominantSystem as VAKType].name} detectado. Use: ${tips.useWords.slice(0, 3).join(', ')}.`,
          icon: <MessageSquare className="h-3 w-3" />,
          color: 'text-blue-500'
        });
      }
      
      // 2. Metaprogram Insights
      if (meta.scores.toward > 0 || meta.scores.awayFrom > 0) {
        const isToward = meta.scores.toward >= meta.scores.awayFrom;
        newSuggestions.push({
          id: `meta-motivation`,
          type: 'metaprogram',
          text: isToward 
            ? "Foco em GANHOS detectado. Enfatize benefícios e resultados positivos."
            : "Foco em EVITAR RISCOS detectado. Enfatize segurança e prevenção de problemas.",
          icon: <Zap className="h-3 w-3" />,
          color: 'text-amber-500'
        });
      }
      
      // 3. Sleight of Mouth (Objection Detection)
      const matchingTemplate = SLEIGHT_TEMPLATES.find(t => 
        content.toLowerCase().includes(t.objection.toLowerCase().substring(0, 12))
      );

      if (matchingTemplate) {
        newSuggestions.push({
          id: `reframing-${matchingTemplate.id}`,
          type: 'reframing',
          text: `Objeção detectada: "${matchingTemplate.objectionCategory}".`,
          fullContent: matchingTemplate.response,
          icon: <RefreshCcw className="h-3 w-3" />,
          color: 'text-primary'
        });
      }
      
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
      setDetectedVAK(null);
      setDetectedMeta(null);
    }
  }, [content, analyzeVAK, analyzeMeta]);

  const handleFeedback = async (suggestionId: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [suggestionId]: type }));
    
    if (user) {
      try {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        await supabase.from('objection_example_feedback').insert({
          user_id: user.id,
          is_useful: type === 'up',
          objection: content.substring(0, 500),
          category: suggestion?.type || 'general'
        });
      } catch (e) {
        console.error("Error saving feedback:", e);
      }
    }
    
    toast.success(type === 'up' ? 'Feedback positivo registrado!' : 'Obrigado pelo feedback. Vamos ajustar.');
  };

  if (suggestions.length === 0 && !detectedVAK?.dominantSystem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mt-4 mb-6"
      >
        <Card className="border-primary/30 bg-primary/5 shadow-lg overflow-hidden border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider">
                <Sparkles className="h-3 w-3 animate-pulse" /> Coach NLP Proativo
              </div>
            {detectedVAK?.dominantSystem && (
              <Badge variant="secondary" className="text-[9px] h-5 px-2 bg-primary/10 text-primary border-primary/20">
                SISTEMA: {VAK_LABELS[detectedVAK.dominantSystem as VAKType].name}
              </Badge>
            )}
            </div>
            
            <div className="space-y-3">
              {suggestions.map((s) => (
                <motion.div 
                  key={s.id} 
                  layout
                  className="group relative bg-card/60 backdrop-blur-sm p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-all shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-full bg-white shadow-sm ${s.color}`}>
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-relaxed">
                        {s.text}
                      </p>
                      
                      {s.fullContent && (
                        <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/5 italic text-[11px] text-muted-foreground">
                          "{s.fullContent.substring(0, 100)}..."
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        {s.fullContent && onApplySuggestion && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-7 text-[10px] gap-1 px-3 shadow-sm bg-primary hover:bg-primary/90"
                            onClick={() => onApplySuggestion(s.fullContent!)}
                          >
                            Aplicar Sugestão <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <div className="flex items-center gap-1 ml-auto">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 rounded-full ${feedbackGiven[s.id] === 'up' ? 'text-success bg-success/10' : 'text-muted-foreground hover:text-success'}`}
                            onClick={() => handleFeedback(s.id, 'up')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 rounded-full ${feedbackGiven[s.id] === 'down' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive'}`}
                            onClick={() => handleFeedback(s.id, 'down')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {(detectedMeta?.scores?.toward > 0 || detectedMeta?.scores?.awayFrom > 0) && (
              <div className="pt-2 border-t border-primary/10 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[9px] font-normal text-muted-foreground bg-white/50">
                  🎯 Motivação: {detectedMeta.scores.toward >= detectedMeta.scores.awayFrom ? 'Em direção a' : 'Afastar-se de'}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-normal text-muted-foreground bg-white/50">
                  📊 Escopo: {detectedMeta.scores.general >= detectedMeta.scores.specific ? 'Global (Big Picture)' : 'Detalhado'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
