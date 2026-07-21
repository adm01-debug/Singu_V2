import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  RefreshCcw, 
  Sparkles, 
  ThumbsUp, 
   ThumbsDown,
   ArrowRight,
   Zap,
   Activity,
   Wand2,
   Target,
   AlertTriangle
} from 'lucide-react';
 import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
 import { VAK_LABELS, VAK_COMMUNICATION_TIPS, VAK_PREDICATES, type VAKType } from '@/types/vak';
import type { VAKAnalysisResult } from '@/types/vak';
import type { MetaprogramAnalysisResult } from '@/types/metaprograms';
import { SLEIGHT_TEMPLATES } from '@/data/sleightOfMouth';
 import { DISC_DETECTION_PATTERNS, DISC_PROFILES } from '@/data/discAdvancedData';
 import type { DISCProfile } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

 interface Suggestion {
   id: string;
    type: 'rapport' | 'reframing' | 'vak' | 'metaprogram' | 'milton' | 'disc';
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
   const [detectedVAK, setDetectedVAK] = useState<VAKAnalysisResult | null>(null);
   const [detectedMeta, setDetectedMeta] = useState<MetaprogramAnalysisResult | null>(null);
   const [rapportScore, setRapportScore] = useState(0);
    const [contactVAK, setContactVAK] = useState<VAKType | null>(null);
    const [contactDISC, setContactDISC] = useState<DISCProfile | null>(null);
    const [discRapport, setDiscRapport] = useState(0);
    const [detectedDISC, setDetectedDISC] = useState<DISCProfile | null>(null);
    const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  
  const { data: contactBehavior } = useQuery({
    queryKey: ['contact-behavior-coach', contactId],
    queryFn: async () => {
      const { data } = await supabase.from('contacts').select('behavior').eq('id', contactId!).maybeSingle();
      return (data?.behavior ?? null) as { vakProfile?: { primary?: VAKType }; discProfile?: DISCProfile } | null;
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!contactBehavior) return;
    if (contactBehavior.vakProfile?.primary) setContactVAK(contactBehavior.vakProfile.primary);
    if (contactBehavior.discProfile) setContactDISC(contactBehavior.discProfile);
  }, [contactBehavior]);

   useEffect(() => {
     if (content.length > 10) {
      const vak = analyzeVAK(content);
      const meta = analyzeMeta(content);
      setDetectedVAK(vak);
      setDetectedMeta(meta);
      
      const newSuggestions: Suggestion[] = [];
      const lowerContent = content.toLowerCase();

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
      
       // 3. Rapport Calculation & Feedback
       if (contactVAK) {
         const predicates = VAK_PREDICATES[contactVAK] || [];
         const lowerContent = content.toLowerCase();
         let matches = 0;
         predicates.forEach(p => {
           if (lowerContent.includes(p)) matches++;
         });
         
         const score = Math.min(100, (matches * 25));
         setRapportScore(score);

         if (score < 50 && content.length > 30) {
           newSuggestions.push({
             id: 'rapport-low',
             type: 'rapport',
             text: `Baixo alinhamento com perfil ${VAK_LABELS[contactVAK as VAKType].name}. Use mais predicados como: ${VAK_COMMUNICATION_TIPS[contactVAK as VAKType].useWords.slice(0, 3).join(', ')}.`,
             icon: <Activity className="h-3 w-3" />,
             color: 'text-destructive'
           });
         } else if (score >= 70) {
            newSuggestions.push({
              id: 'rapport-high',
              type: 'milton',
              text: "Rapport excelente detectado! Agora é o momento de usar um Comando Embutido.",
              fullContent: `Você já deve ter percebido que...`,
              icon: <Wand2 className="h-3 w-3" />,
              color: 'text-success'
            });
         }
       }

      // 4. Sleight of Mouth (Objection Detection)
      const matchingTemplates = SLEIGHT_TEMPLATES.filter(t => 
        lowerContent.includes(t.objection.toLowerCase().substring(0, 12))
      ).slice(0, 2);

       matchingTemplates.forEach(t => {
         newSuggestions.push({
           id: `reframing-${t.id}`,
           type: 'reframing',
           text: `Objeção: "${t.objectionCategory}". Padrão: ${t.pattern}.`,
           fullContent: t.response,
           icon: <RefreshCcw className="h-3 w-3" />,
           color: 'text-primary'
         });
       });

      // 5. Next Steps / Action recommendations
      if (lowerContent.includes('valor') || lowerContent.includes('preço') || lowerContent.includes('investimento')) {
        newSuggestions.push({
          id: 'next-step-price',
          type: 'milton',
          text: "Mencionado valor. Sugestão: Enquadre como investimento estratégico.",
          icon: <ArrowRight className="h-3 w-3" />,
          color: 'text-info'
        });
      }
       
        // 6. DISC Realtime Analysis & Rapport (Unified Behavioral Coach)
        let currentDISC: 'D' | 'I' | 'S' | 'C' = 'I';
        let maxDiscScore = 0;
        const discScores: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
        
        for (const pattern of DISC_DETECTION_PATTERNS) {
          const pKey = pattern.profile as string;
          for (const regex of pattern.patterns) {
            const matches = content.match(regex);
            if (matches) discScores[pKey] = (discScores[pKey] || 0) + (matches.length * 10);
          }
        }
        
        Object.entries(discScores).forEach(([p, score]) => {
          if (score > maxDiscScore) {
            maxDiscScore = score;
            currentDISC = p as 'D' | 'I' | 'S' | 'C';
          }
        });
 
        if (maxDiscScore > 0) {
          setDetectedDISC(currentDISC);
          const profileInfo = DISC_PROFILES[currentDISC as keyof typeof DISC_PROFILES];
          newSuggestions.push({
            id: `disc-self-${currentDISC}`,
            type: 'disc',
            text: `Você está soando como um perfil ${profileInfo?.name || currentDISC}.`,
            icon: <Target className="h-3 w-3" />,
            color: 'text-indigo-500'
          });
 
          if (contactDISC) {
            const isMatch = contactDISC === currentDISC;
            const rapport = isMatch ? 100 : 40;
            setDiscRapport(rapport);
 
            if (!isMatch) {
              const targetInfo = DISC_PROFILES[contactDISC];
              const discTips: Record<string, string> = {
                D: 'direto e focado em resultados',
                I: 'entusiasta e focado em pessoas',
                S: 'calmo e focado em segurança',
                C: 'analítico e focado em detalhes'
              };
              newSuggestions.push({
                id: 'disc-mismatch',
                type: 'disc',
                text: `Alerta de Atrito: O contato é ${targetInfo?.name}. Tente ser mais ${discTips[contactDISC as string] || 'adaptável'}.`,
                icon: <AlertTriangle className="h-3 w-3" />,
                color: 'text-orange-500'
              });
            }
          }
        }
 
        setSuggestions(newSuggestions);
      } else {
        setSuggestions([]);
       setDetectedVAK(null);
       setDetectedMeta(null);
       setRapportScore(0);
     }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [content, analyzeVAK, analyzeMeta, contactVAK]);

  const handleFeedback = async (suggestionId: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [suggestionId]: type }));
    
    if (user) {
      try {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        await supabase.from('objection_example_feedback').insert({
          user_id: user.id,
          is_useful: type === 'up',
          objection: content.substring(0, 500),
          category: suggestion?.type || 'general',
          interaction_id: null as unknown as string
        });
      } catch (e) {
        logger.error("Error saving feedback:", e);
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
             <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider">
                 <Sparkles className="h-3 w-3 animate-pulse" /> Coach NLP Proativo
               </div>
               
                <div className="flex gap-4 flex-1 max-w-[300px]">
                  {contactVAK && (
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-muted-foreground uppercase font-semibold">
                        <span>VAK Rapport</span>
                        <span className={rapportScore >= 70 ? 'text-success' : rapportScore >= 40 ? 'text-warning' : 'text-destructive'}>
                          {rapportScore}%
                        </span>
                      </div>
                      <Progress value={rapportScore} className="h-1" />
                    </div>
                  )}
                  
                  {contactDISC && (
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-muted-foreground uppercase font-semibold">
                        <span>DISC Rapport</span>
                        <span className={discRapport >= 70 ? 'text-success' : discRapport >= 40 ? 'text-warning' : 'text-destructive'}>
                          {discRapport}%
                        </span>
                      </div>
                      <Progress value={discRapport} className="h-1" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {detectedVAK?.dominantSystem && (
                    <Badge variant="secondary" className="text-[9px] h-5 px-2 bg-blue-50 text-blue-600 border-blue-100">
                      VAK: {VAK_LABELS[detectedVAK.dominantSystem as VAKType].name}
                    </Badge>
                  )}
                  {detectedDISC && (
                    <Badge variant="secondary" className="text-[9px] h-5 px-2 bg-indigo-50 text-indigo-600 border-indigo-100">
                      DISC: {detectedDISC}
                    </Badge>
                  )}
                </div>
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
                            className={`h-7 w-7 rounded-full ${feedbackGiven[s.id] === "up" ? 'text-success bg-success/10' : 'text-muted-foreground hover:text-success'}`}
                            aria-label="Útil" onClick={() => handleFeedback(s.id, 'up')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 rounded-full ${feedbackGiven[s.id] === "down" ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive'}`}
                            aria-label="Não útil" onClick={() => handleFeedback(s.id, 'down')}
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
