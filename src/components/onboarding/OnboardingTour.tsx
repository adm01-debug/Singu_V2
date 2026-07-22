import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowLeft, ArrowRight, Lightbulb, Zap, Target,
  Users, BarChart3, Calendar, Settings, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: typeof Lightbulb;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao SINGU! 🎉',
    description: 'Vamos fazer um tour rápido para você conhecer as principais funcionalidades da plataforma.',
    position: 'center',
    icon: Sparkles,
  },
  {
    id: 'contacts',
    title: 'Gestão de Contatos',
    description: 'Aqui você gerencia todos os seus contatos, com informações detalhadas e histórico de interações.',
    target: '[data-tour="contacts"]',
    position: 'right',
    icon: Users,
  },
  {
    id: 'companies',
    title: 'Empresas',
    description: 'Organize seus contatos por empresa e acompanhe relacionamentos corporativos.',
    target: '[data-tour="companies"]',
    position: 'right',
    icon: Target,
  },
  {
    id: 'analytics',
    title: 'Análises e Insights',
    description: 'Descubra padrões de comportamento e receba recomendações inteligentes para melhorar seus relacionamentos.',
    target: '[data-tour="analytics"]',
    position: 'right',
    icon: BarChart3,
  },
  {
    id: 'calendar',
    title: 'Calendário',
    description: 'Acompanhe datas importantes, aniversários e follow-ups agendados.',
    target: '[data-tour="calendar"]',
    position: 'right',
    icon: Calendar,
  },
  {
    id: 'quick-add',
    title: 'Adição Rápida',
    description: 'Use o botão + para adicionar rapidamente contatos, empresas ou interações.',
    target: '[data-tour="quick-add"]',
    position: 'left',
    icon: Zap,
  },
  {
    id: 'settings',
    title: 'Configurações',
    description: 'Personalize sua experiência, configure notificações e preferências.',
    target: '[data-tour="settings"]',
    position: 'left',
    icon: Settings,
  },
  {
    id: 'complete',
    title: 'Pronto para começar!',
    description: 'Você já conhece o básico. Explore a plataforma e descubra todas as funcionalidades avançadas.',
    position: 'center',
    icon: Sparkles,
  },
];

interface OnboardingTourProps {
  steps?: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({
  steps = DEFAULT_TOUR_STEPS,
  isOpen,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight target element
  useEffect(() => {
    if (!isOpen || !step?.target) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isOpen, step]);

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const Icon = step.icon;

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect || step.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case 'right':
        return {
          position: 'fixed' as const,
          top: Math.max(padding, targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
          left: targetRect.right + padding,
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: Math.max(padding, targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
          left: targetRect.left - tooltipWidth - padding,
        };
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: targetRect.bottom + padding,
          left: Math.max(padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2),
        };
      case 'top':
        return {
          position: 'fixed' as const,
          top: targetRect.top - tooltipHeight - padding,
          left: Math.max(padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2),
        };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        data-tour-dialog="true"
      >
        {/* Dark overlay with cutout for target */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Spotlight on target */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-lg ring-4 ring-primary shadow-md"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-xl shadow-md p-6 w-80 z-[60]"
          style={getTooltipStyle()}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{step.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2 -mt-2"
              onClick={onSkip}
              aria-label="Pular tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">
            {step.description}
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Passo {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={isFirstStep}
              className={cn(isFirstStep && 'invisible')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground"
              >
                Pular
              </Button>
              <Button size="sm" onClick={nextStep}>
                {isLastStep ? 'Concluir' : 'Próximo'}
                {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing tour state
// eslint-disable-next-line react-refresh/only-export-components
export function useOnboardingTour(tourId: string = 'main') {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(() => {
    try {
      return localStorage.getItem(`tour-completed-${tourId}`) === 'true';
    } catch {
      return false;
    }
  });

  const startTour = () => setIsOpen(true);
  
  const completeTour = () => {
    setIsOpen(false);
    setHasCompleted(true);
    try { localStorage.setItem(`tour-completed-${tourId}`, 'true'); } catch { /* quota/private */ }
  };

  const skipTour = completeTour;

  const resetTour = () => {
    setHasCompleted(false);
    try { localStorage.removeItem(`tour-completed-${tourId}`); } catch { /* quota/private */ }
  };

  return {
    isOpen,
    hasCompleted,
    startTour,
    completeTour,
    skipTour,
    resetTour,
  };
}

export default OnboardingTour;
