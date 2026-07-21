// ==============================================
// NEURO TOOLTIP SYSTEM - Educational Tooltips for Neuromarketing
// ==============================================

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Zap, Heart, Lightbulb } from 'lucide-react';
import { BrainSystem, PrimalStimulus, Neurochemical } from '@/types/neuromarketing';
import { BRAIN_SYSTEM_INFO, PRIMAL_STIMULUS_INFO, NEUROCHEMICAL_INFO } from '@/data/neuromarketingData';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
type NeuroConceptType = 'brain' | 'stimulus' | 'chemical' | 'custom';

interface NeuroTooltipProps {
  type: NeuroConceptType;
  concept?: BrainSystem | PrimalStimulus | Neurochemical;
  customTitle?: string;
  customDescription?: string;
  customTips?: string[];
  children: React.ReactNode;
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
  className?: string;
}

// ============================================
// EDUCATIONAL CONTENT
// ============================================
const BRAIN_EDUCATION: Record<BrainSystem, { science: string; salesTip: string }> = {
  reptilian: {
    science: 'O cérebro reptiliano (tronco cerebral) evoluiu há 500 milhões de anos. É responsável por decisões de sobrevivência e reage a ameaças em milissegundos.',
    salesTip: 'Para ativar: use urgência genuína, mostre perdas por inação, ofereça garantias de segurança.'
  },
  limbic: {
    science: 'O sistema límbico evoluiu há 150 milhões de anos. Processa emoções, memórias e é crucial para formação de confiança e conexões sociais.',
    salesTip: 'Para ativar: construa rapport primeiro, use storytelling, mostre valores compartilhados.'
  },
  neocortex: {
    science: 'O neocórtex é a parte mais recente do cérebro (2-3 milhões de anos). Responsável por pensamento abstrato, linguagem e análise lógica.',
    salesTip: 'Para ativar: forneça dados, comparações e tempo para análise. Nunca pressione.'
  }
};

const STIMULUS_EDUCATION: Record<PrimalStimulus, { science: string; example: string }> = {
  self_centered: {
    science: 'O cérebro primitivo é fundamentalmente egocêntrico - evoluiu para garantir a sobrevivência individual.',
    example: 'Use "você" em vez de "nós". Fale sobre os problemas DELE, não sobre seu produto.'
  },
  contrast: {
    science: 'O cérebro detecta contrastes rapidamente porque mudanças no ambiente podem significar ameaças.',
    example: 'Mostre ANTES vs DEPOIS, COM vs SEM, PROBLEMA vs SOLUÇÃO.'
  },
  tangible: {
    science: 'O cérebro primitivo não entende conceitos abstratos - evoluiu para processar o mundo físico.',
    example: 'Use números específicos, prazos exatos, provas concretas e demonstrações.'
  },
  memorable: {
    science: 'Devido ao efeito de primazia e recência, lembramos melhor o início e o fim das experiências.',
    example: 'Capriche na abertura e no fechamento. O meio pode ser esquecido.'
  },
  visual: {
    science: '50% do cérebro é dedicado ao processamento visual. Imagens são processadas 60.000x mais rápido que texto.',
    example: 'Use imagens, gráficos, demonstrações visuais e metáforas visuais.'
  },
  emotional: {
    science: 'Decisões são tomadas emocionalmente e depois justificadas racionalmente. Emoção = Motion (movimento).',
    example: 'Conecte sua solução a uma emoção forte: alívio, orgulho, segurança, alegria.'
  }
};

const CHEMICAL_EDUCATION: Record<Neurochemical, { function: string; trigger: string }> = {
  dopamine: {
    function: 'Neurotransmissor do prazer e recompensa. Cria antecipação e desejo.',
    trigger: 'Promessas de novidade, exclusividade, surpresas positivas, gamificação.'
  },
  oxytocin: {
    function: 'Hormônio da confiança e conexão. Fortalece laços sociais.',
    trigger: 'Contato visual, aperto de mão, histórias pessoais, vulnerabilidade.'
  },
  cortisol: {
    function: 'Hormônio do estresse. Aumenta foco e urgência para ação.',
    trigger: 'Escassez, prazo limitado, risco de perda, ameaças competitivas.'
  },
  serotonin: {
    function: 'Neurotransmissor do bem-estar e status. Gera confiança e calma.',
    trigger: 'Reconhecimento, status, exclusividade, pertencimento a grupo seleto.'
  },
  endorphin: {
    function: 'Analgésico natural. Gera prazer e reduz dor/desconforto.',
    trigger: 'Humor, risadas, alívio de dor, exercício, conquistas.'
  },
  adrenaline: {
    function: 'Hormônio de ação. Prepara para luta ou fuga.',
    trigger: 'Desafios, competição, urgência extrema, aventura.'
  }
};

// ============================================
// COMPONENT
// ============================================
const NeuroTooltip = ({
  type,
  concept,
  customTitle,
  customDescription,
  customTips,
  children,
  showIcon = true,
  iconPosition = 'right',
  className
}: NeuroTooltipProps) => {
  // Get content based on type
  const getContent = () => {
    if (type === 'custom') {
      return {
        title: customTitle || 'Dica',
        icon: <Lightbulb className="h-4 w-4" />,
        color: 'hsl(var(--primary))',
        mainDescription: customDescription || '',
        tips: customTips || []
      };
    }

    if (type === 'brain' && concept) {
      const info = BRAIN_SYSTEM_INFO[concept as BrainSystem];
      const education = BRAIN_EDUCATION[concept as BrainSystem];
      return {
        title: info.namePt,
        icon: info.icon,
        color: info.color,
        mainDescription: education.science,
        tips: [education.salesTip]
      };
    }

    if (type === 'stimulus' && concept) {
      const info = PRIMAL_STIMULUS_INFO[concept as PrimalStimulus];
      const education = STIMULUS_EDUCATION[concept as PrimalStimulus];
      return {
        title: info.namePt,
        icon: <Zap className="h-4 w-4" />,
        color: info.color,
        mainDescription: education.science,
        tips: [`Exemplo: ${education.example}`]
      };
    }

    if (type === 'chemical' && concept) {
      const info = NEUROCHEMICAL_INFO[concept as Neurochemical];
      const education = CHEMICAL_EDUCATION[concept as Neurochemical];
      return {
        title: info.namePt,
        icon: <Heart className="h-4 w-4" />,
        color: info.color,
        mainDescription: education.function,
        tips: [`Como ativar: ${education.trigger}`]
      };
    }

    return null;
  };

  const content = getContent();
  if (!content) return <>{children}</>;

  const IconComponent = () => (
    <HelpCircle 
      className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" 
    />
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            {showIcon && iconPosition === 'left' && <IconComponent />}
            {children}
            {showIcon && iconPosition === 'right' && <IconComponent />}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-0 overflow-hidden"
          sideOffset={8}
        >
          <div className="p-3 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div 
                className="p-1.5 rounded-md text-primary-foreground text-sm"
                style={{ backgroundColor: content.color }}
              >
                {content.icon}
              </div>
              <span className="font-semibold text-sm">{content.title}</span>
              <Badge variant="outline" className="text-[10px] ml-auto">
                Neurociência
              </Badge>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {content.mainDescription}
            </p>

            {/* Tips */}
            {content.tips.length > 0 && (
              <div className="pt-2 border-t">
                {content.tips.map((tip, index) => (
                  <div key={`${tip.slice(0, 20)}-${index}`} className="flex items-start gap-1.5">
                    <Lightbulb className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-warning dark:text-warning">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ============================================
// CONVENIENCE COMPONENTS
// ============================================
export const BrainTooltip = ({ 
  brain, 
  children,
  ...props 
}: { brain: BrainSystem; children: React.ReactNode } & Partial<NeuroTooltipProps>) => (
  <NeuroTooltip type="brain" concept={brain} {...props}>
    {children}
  </NeuroTooltip>
);

export const StimulusTooltip = ({ 
  stimulus, 
  children,
  ...props 
}: { stimulus: PrimalStimulus; children: React.ReactNode } & Partial<NeuroTooltipProps>) => (
  <NeuroTooltip type="stimulus" concept={stimulus} {...props}>
    {children}
  </NeuroTooltip>
);

export const ChemicalTooltip = ({ 
  chemical, 
  children,
  ...props 
}: { chemical: Neurochemical; children: React.ReactNode } & Partial<NeuroTooltipProps>) => (
  <NeuroTooltip type="chemical" concept={chemical} {...props}>
    {children}
  </NeuroTooltip>
);

export const CustomNeuroTooltip = ({ 
  title, 
  description, 
  tips,
  children,
  ...props 
}: { 
  title: string; 
  description: string; 
  tips?: string[];
  children: React.ReactNode;
} & Partial<NeuroTooltipProps>) => (
  <NeuroTooltip 
    type="custom" 
    customTitle={title}
    customDescription={description}
    customTips={tips}
    {...props}
  >
    {children}
  </NeuroTooltip>
);

export default NeuroTooltip;
