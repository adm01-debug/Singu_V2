// ==============================================
// NEURO BRIEFING CARD - Neural Summary for Pre-Contact
// Quick neural profile summary for briefing integration
// ==============================================

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  AlertTriangle, 
  Heart,
  Zap,
  Target,
  CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem, PrimalStimulus } from '@/types/neuromarketing';
import { cn } from '@/lib/utils';

interface NeuroBriefingCardProps {
  contactName: string;
  discProfile?: string | null;
  interactions?: { content: string; transcription?: string }[];
  className?: string;
}

const NeuroBriefingCard = ({ 
  contactName, 
  discProfile,
  interactions = [],
  className
}: NeuroBriefingCardProps) => {
  const { 
    analyzeText, 
    generateNeuroProfileFromDISC,
    BRAIN_SYSTEM_INFO,
    PRIMAL_STIMULUS_INFO
  } = useNeuromarketing();

  const { dominantBrain, brainScores, topStimuli, keyTips } = useMemo(() => {
    const allText = interactions
      .map(i => `${i.content || ''} ${i.transcription || ''}`)
      .join('\n\n');
    
    const analysis = allText.length >= 50 ? analyzeText(allText) : null;
    const discBasedProfile = discProfile ? generateNeuroProfileFromDISC(discProfile as 'D' | 'I' | 'S' | 'C') : null;

    const brainScores = analysis?.brainSystemScores || {
      reptilian: discBasedProfile?.brainBalance?.reptilian || 33,
      limbic: discBasedProfile?.brainBalance?.limbic || 34,
      neocortex: discBasedProfile?.brainBalance?.neocortex || 33
    };

    const dominantBrain = (Object.entries(brainScores) as [BrainSystem, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    // Get top stimuli from analysis or DISC correlation
    let topStimuli: PrimalStimulus[] = [];
    if (analysis && analysis.detectedStimuli.length > 0) {
      topStimuli = analysis.detectedStimuli
        .filter(s => s.score > 20)
        .slice(0, 3)
        .map(s => s.stimulus);
    } else if (discBasedProfile?.responsiveStimuli) {
      topStimuli = discBasedProfile.responsiveStimuli.slice(0, 3);
    } else {
      topStimuli = ['self_centered', 'emotional'];
    }

    // Generate key tips based on dominant brain
    const keyTips = BRAIN_SYSTEM_INFO[dominantBrain].communicationStyle.slice(0, 2);

    return { dominantBrain, brainScores, topStimuli, keyTips };
  }, [interactions, discProfile, analyzeText, generateNeuroProfileFromDISC, BRAIN_SYSTEM_INFO]);

  const firstName = contactName.split(' ')[0];
  const brainInfo = BRAIN_SYSTEM_INFO[dominantBrain];

  const getBrainIcon = (brain: BrainSystem) => {
    switch (brain) {
      case 'reptilian': return <AlertTriangle className="h-4 w-4" />;
      case 'limbic': return <Heart className="h-4 w-4" />;
      case 'neocortex': return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        brainInfo.bgColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.span 
            className="text-2xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            {brainInfo.icon}
          </motion.span>
          <div>
            <h4 className="font-semibold text-sm">Perfil Neural</h4>
            <p className="text-xs text-muted-foreground">{brainInfo.namePt}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Neuro
        </Badge>
      </div>

      {/* Brain Balance Mini */}
      <div className="flex gap-2 mb-3">
        {(Object.entries(brainScores) as [BrainSystem, number][]).map(([brain, score]) => (
          <div 
            key={brain} 
            className={cn(
              "flex-1 text-center p-1.5 rounded text-xs",
              brain === dominantBrain ? 'bg-background/50 font-medium' : 'opacity-60'
            )}
          >
            <span>{BRAIN_SYSTEM_INFO[brain].icon}</span>
            <span className="ml-1">{score}%</span>
          </div>
        ))}
      </div>

      {/* Top Stimuli */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <Target className="h-3 w-3" />
          Estímulos Efetivos:
        </p>
        <div className="flex gap-1 flex-wrap">
          {topStimuli.map(stim => (
            <Badge key={stim} variant="secondary" className="text-xs">
              {PRIMAL_STIMULUS_INFO[stim]?.icon} {PRIMAL_STIMULUS_INFO[stim]?.namePt}
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="space-y-1">
        {keyTips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-2 text-xs"
          >
            <CheckCircle className="h-3 w-3 text-success shrink-0 mt-0.5" />
            <span>{tip}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default NeuroBriefingCard;
