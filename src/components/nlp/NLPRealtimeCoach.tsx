import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, MessageSquare, RefreshCcw, Copy, Sparkles } from 'lucide-react';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { VAK_LABELS, VAK_COMMUNICATION_TIPS } from '@/types/vak';
import { METAPROGRAM_LABELS } from '@/types/metaprograms';
import { SLEIGHT_TEMPLATES } from '@/data/sleightOfMouth';
import { toast } from 'sonner';

interface Props {
  content: string;
  contactId?: string;
}

export function NLPRealtimeCoach({ content, contactId }: Props) {
  const { analyzeText: analyzeVAK } = useVAKAnalysis();
  const { analyzeText: analyzeMeta } = useMetaprogramAnalysis();
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [detectedVAK, setDetectedVAK] = useState<any>(null);
  
  useEffect(() => {
    if (content.length > 20) {
      const vak = analyzeVAK(content);
      setDetectedVAK(vak);
      
      // Basic suggestion logic
      const newSuggestions = [];
      if (vak.dominantSystem) {
        const tips = VAK_COMMUNICATION_TIPS[vak.dominantSystem];
        newSuggestions.push(`O contato parece ${VAK_LABELS[vak.dominantSystem].name}. Tente usar: ${tips.useWords.slice(0, 3).join(', ')}.`);
      }
      
      // Match objections for reframing
      const matchingTemplate = SLEIGHT_TEMPLATES.find(t => 
        content.toLowerCase().includes(t.objection.toLowerCase().substring(0, 15))
      );
      if (matchingTemplate) {
        newSuggestions.push(`Objeção detectada! Sugestão de reenquadramento: "${matchingTemplate.response.substring(0, 60)}..."`);
      }
      
      setSuggestions(newSuggestions);
    }
  }, [content]);

  if (content.length < 20) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
          <Sparkles className="h-3 w-3" /> Coach NLP em Tempo Real
        </div>
        
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs bg-white/50 p-2 rounded border border-primary/10">
              <Lightbulb className="h-3 w-3 text-warning shrink-0 mt-0.5" />
              <p className="flex-1">{s}</p>
            </div>
          ))}
        </div>

        {detectedVAK?.dominantSystem && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-bold">
              Detecção VAK: {VAK_LABELS[detectedVAK.dominantSystem as keyof typeof VAK_LABELS].icon} {VAK_LABELS[detectedVAK.dominantSystem as keyof typeof VAK_LABELS].name}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
