import { ReactNode, useState } from 'react';
import { HelpCircle, X, ExternalLink, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ContextualHelpTooltipProps {
  /** Title of the help content */
  title: string;
  /** Main description text */
  description: string;
  /** Optional tips or examples */
  tips?: string[];
  /** Optional link for more information */
  learnMoreUrl?: string;
  /** Size of the help icon */
  size?: 'sm' | 'md' | 'lg';
  /** Trigger mode */
  mode?: 'tooltip' | 'popover';
  /** Position of the icon relative to content */
  position?: 'inline' | 'after' | 'before';
  /** Children to wrap */
  children?: ReactNode;
  /** Additional class name */
  className?: string;
  /** Aria label for icon */
  ariaLabel?: string;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function ContextualHelpTooltip({
  title,
  description,
  tips,
  learnMoreUrl,
  size = 'sm',
  mode = 'tooltip',
  position = 'inline',
  children,
  className,
  ariaLabel,
}: ContextualHelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const HelpIcon = (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center text-muted-foreground/70 hover:text-muted-foreground',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded',
        'transition-colors cursor-help',
        position === 'inline' && 'ml-1',
        position === 'before' && 'mr-1',
        className
      )}
      aria-label={ariaLabel || `Ajuda: ${title}`}
    >
      <HelpCircle className={cn(sizeClasses[size])} aria-hidden="true" />
    </button>
  );

  const HelpContent = (
    <div className="space-y-2 max-w-xs">
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      
      {tips && tips.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-1">Dicas:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-primary" aria-hidden="true">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {learnMoreUrl && (
        <a
          href={learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
        >
          Saiba mais
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );

  if (mode === 'popover') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {position === 'before' && (
          <PopoverTrigger asChild>{HelpIcon}</PopoverTrigger>
        )}
        {children}
        {position !== 'before' && (
          <PopoverTrigger asChild>{HelpIcon}</PopoverTrigger>
        )}
        <PopoverContent
          side="top"
          align="center"
          className="w-80 p-4"
          sideOffset={8}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                {HelpContent}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 w-6 h-6"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar ajuda"
                >
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <span className="inline-flex items-center">
          {position === 'before' && <TooltipTrigger asChild>{HelpIcon}</TooltipTrigger>}
          {children}
          {position !== 'before' && <TooltipTrigger asChild>{HelpIcon}</TooltipTrigger>}
        </span>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs p-3"
          sideOffset={8}
        >
          {HelpContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Predefined help content for common features
export const helpContent = {
  relationshipScore: {
    title: 'Score de Relacionamento',
    description: 'Mede a força do seu relacionamento baseado em frequência de interações, sentimento e engajamento.',
    tips: [
      'Interações regulares aumentam o score',
      'Feedbacks positivos melhoram a pontuação',
      'Falta de contato reduz o score gradualmente',
    ],
  },
  closingScore: {
    title: 'Probabilidade de Fechamento',
    description: 'Indica a chance de conversão do contato baseado em comportamentos e engajamento observados.',
    tips: [
      'Baseado em padrões de comunicação',
      'Considera o estágio do relacionamento',
      'Atualiza automaticamente com novas interações',
    ],
  },
  vakProfile: {
    title: 'Perfil VAK',
    description: 'Visual, Auditivo ou Cinestésico - identifica como o contato processa melhor as informações.',
    tips: [
      'Visual: prefere imagens e gráficos',
      'Auditivo: prefere conversas e explicações',
      'Cinestésico: prefere experiências práticas',
    ],
  },
  discProfile: {
    title: 'Perfil DISC',
    description: 'Dominância, Influência, Estabilidade, Conformidade - descreve o estilo de comportamento.',
    tips: [
      'D: Direto, orientado a resultados',
      'I: Entusiasta, social',
      'S: Paciente, colaborativo',
      'C: Analítico, detalhista',
    ],
  },
  emotionalIntelligence: {
    title: 'Inteligência Emocional',
    description: 'Avaliação baseada nos 5 pilares de Daniel Goleman para entender o perfil emocional.',
    tips: [
      'Autoconsciência: reconhece emoções',
      'Autorregulação: controla impulsos',
      'Empatia: entende os outros',
    ],
  },
  cognitiveBiases: {
    title: 'Vieses Cognitivos',
    description: 'Padrões de pensamento identificados que podem influenciar decisões.',
    tips: [
      'Use para personalizar argumentos',
      'Evite explorar vieses negativamente',
      'Adapte sua comunicação',
    ],
  },
  healthScore: {
    title: 'Saúde do Relacionamento',
    description: 'Indicador geral da qualidade e estabilidade do relacionamento ao longo do tempo.',
    tips: [
      'Monitora interações recentes',
      'Considera satisfação implícita',
      'Alerta para relacionamentos em risco',
    ],
  },
};

export default ContextualHelpTooltip;
