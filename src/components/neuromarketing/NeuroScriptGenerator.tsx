// ==============================================
// NEURO SCRIPT GENERATOR - Brain-Optimized Sales Scripts
// Generates scripts targeting specific brain systems
// ==============================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Copy, 
  Check, 
  RefreshCw,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem, PrimalStimulus } from '@/types/neuromarketing';
import { generateScriptSections } from '@/data/neuroScriptSections';
import { cn } from '@/lib/utils';

interface NeuroScriptGeneratorProps {
  contactId: string;
  contactName: string;
  discProfile?: string | null;
  vakProfile?: string | null;
  interactions?: { content: string; transcription?: string }[];
  className?: string;
}

interface ScriptSection {
  name: string;
  brainTarget: BrainSystem;
  stimuliUsed: PrimalStimulus[];
  content: string;
  timing: string;
}

const NeuroScriptGenerator = ({ 
  contactId, 
  contactName, 
  discProfile,
  vakProfile,
  interactions = [],
  className
}: NeuroScriptGeneratorProps) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['opening']));
  const [scriptGoal, setScriptGoal] = useState<'discovery' | 'presentation' | 'closing' | 'objection'>('presentation');

  const {
    analyzeText,
    generateNeuroProfileFromDISC,
    BRAIN_SYSTEM_INFO,
    PRIMAL_STIMULUS_INFO
  } = useNeuromarketing();

  // Analyze contact profile
  const neuroProfile = useMemo(() => {
    const allText = interactions
      .map(i => `${i.content || ''} ${i.transcription || ''}`)
      .join('\n\n');
    
    if (allText.length >= 50) {
      return analyzeText(allText);
    }
    return null;
  }, [interactions, analyzeText]);

  const discBasedProfile = useMemo(() => {
    if (!discProfile) return null;
    return generateNeuroProfileFromDISC(discProfile as 'D' | 'I' | 'S' | 'C');
  }, [discProfile, generateNeuroProfileFromDISC]);

  const dominantBrain = neuroProfile?.detectedBrainSystem || discBasedProfile?.dominantBrain || 'limbic';
  const firstName = contactName.split(' ')[0];

  const scriptSections = useMemo(() => generateScriptSections(scriptGoal, dominantBrain, firstName), [dominantBrain, firstName, scriptGoal]);

  const handleCopy = (content: string, section: string) => {
    navigator.clipboard.writeText(content);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getBrainIcon = (brain: BrainSystem) => {
    switch (brain) {
      case 'reptilian': return <AlertTriangle className="h-4 w-4" />;
      case 'limbic': return <Heart className="h-4 w-4" />;
      case 'neocortex': return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <MessageSquare className="h-5 w-5 text-primary" />
            </motion.div>
            Gerador de Scripts Neuro-Otimizados
          </CardTitle>
          <Badge className={cn(BRAIN_SYSTEM_INFO[dominantBrain].bgColor)}>
            {BRAIN_SYSTEM_INFO[dominantBrain].icon} {BRAIN_SYSTEM_INFO[dominantBrain].namePt}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Scripts otimizados para o perfil neural de {firstName}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Goal Selector */}
        <div className="flex gap-3">
          <Select value={scriptGoal} onValueChange={(v) => setScriptGoal(v as typeof scriptGoal)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discovery">🔍 Descoberta</SelectItem>
              <SelectItem value="presentation">📊 Apresentação</SelectItem>
              <SelectItem value="closing">🤝 Fechamento</SelectItem>
              <SelectItem value="objection">🛡️ Objeções</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Regenerar
          </Button>
        </div>

        <Separator />

        {/* Script Sections */}
        <div className="space-y-3">
          {scriptSections.map((section, index) => (
            <motion.div
              key={section.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border rounded-lg overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.name)}
                className="w-full p-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "p-1.5 rounded-full",
                    BRAIN_SYSTEM_INFO[section.brainTarget].bgColor
                  )}>
                    {getBrainIcon(section.brainTarget)}
                  </span>
                  <div className="text-left">
                    <h4 className="font-medium text-sm">{section.name}</h4>
                    <p className="text-xs text-muted-foreground">{section.timing}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {section.stimuliUsed.map(stim => (
                    <span key={stim} className="text-sm">
                      {PRIMAL_STIMULUS_INFO[stim]?.icon}
                    </span>
                  ))}
                  {expandedSections.has(section.name) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              
              {/* Section Content */}
              <AnimatePresence>
                {expandedSections.has(section.name) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="p-3 bg-primary/5 rounded-lg text-sm relative">
                        <p className="pr-8">{section.content}</p>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Confirmar"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => handleCopy(section.content, section.name)}
                        >
                          {copiedSection === section.name ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      
                      {/* Stimuli Explanation */}
                      <div className="flex flex-wrap gap-2">
                        {section.stimuliUsed.map(stim => (
                          <Badge key={stim} variant="outline" className="text-xs">
                            {PRIMAL_STIMULUS_INFO[stim]?.icon} {PRIMAL_STIMULUS_INFO[stim]?.namePt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Pro Tips */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-medium text-primary">Dicas para {BRAIN_SYSTEM_INFO[dominantBrain].namePt}:</p>
              <ul className="text-muted-foreground space-y-0.5">
                {BRAIN_SYSTEM_INFO[dominantBrain].communicationStyle.slice(0, 3).map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroScriptGenerator;
