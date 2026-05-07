import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  User,
  Users,
  MessageSquare,
  Building2,
  Target,
  Zap,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { celebrate } from '@/lib/celebrate';

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  hasProfile: boolean;
  hasContacts: boolean;
  hasCompanies: boolean;
  hasInteractions: boolean;
  /** True quando o usuário já criou pelo menos um deal no Pipeline. */
  hasDeals?: boolean;
  /** True quando há scoring (lead score ou similar) computado. */
  hasLeadScore?: boolean;
  /** True quando o usuário ativou pelo menos uma sequência. */
  hasSequence?: boolean;
}

const STORAGE_DISMISSED = 'singu_onboarding_dismissed';
const STORAGE_CELEBRATED = 'singu_onboarding_celebrated_v2';

export const OnboardingChecklist = React.memo(function OnboardingChecklist({
  hasProfile,
  hasContacts,
  hasCompanies,
  hasInteractions,
  hasDeals = false,
  hasLeadScore = false,
  hasSequence = false,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_DISMISSED);
    if (isDismissed === 'true') setDismissed(true);
  }, []);

  const steps: ChecklistStep[] = [
    {
      id: 'profile',
      label: 'Complete seu perfil',
      description: 'Nome, foto e DISC',
      icon: User,
      path: '/configuracoes',
      completed: hasProfile,
    },
    {
      id: 'company',
      label: 'Cadastre uma empresa',
      description: 'Sua primeira conta-alvo',
      icon: Building2,
      path: '/empresas',
      completed: hasCompanies,
    },
    {
      id: 'contact',
      label: 'Adicione um contato',
      description: 'Vinculado à empresa',
      icon: Users,
      path: '/contatos',
      completed: hasContacts,
    },
    {
      id: 'interaction',
      label: 'Registre uma interação',
      description: 'Email, WhatsApp ou call',
      icon: MessageSquare,
      path: '/interacoes',
      completed: hasInteractions,
    },
    {
      id: 'deal',
      label: 'Crie um deal',
      description: 'Comece o pipeline',
      icon: Target,
      path: '/pipeline',
      completed: hasDeals,
    },
    {
      id: 'score',
      label: 'Veja o lead score',
      description: 'IA classificando seus leads',
      icon: Sparkles,
      path: '/lead-scoring',
      completed: hasLeadScore,
    },
    {
      id: 'sequence',
      label: 'Ative uma sequência',
      description: 'Cadência multi-canal',
      icon: Zap,
      path: '/sequences',
      completed: hasSequence,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const allComplete = completedCount === steps.length;

  // Auto-collapse depois de 4 marcos
  useEffect(() => {
    if (completedCount >= 4 && completedCount < steps.length) {
      setIsOpen(false);
    }
  }, [completedCount, steps.length]);

  // Celebração ao completar todos os 7 (uma única vez)
  useEffect(() => {
    if (!allComplete) return;
    try {
      if (localStorage.getItem(STORAGE_CELEBRATED) === 'true') return;
      localStorage.setItem(STORAGE_CELEBRATED, 'true');
      celebrate({
        kind: 'milestone',
        title: 'Onboarding completo!',
        description: 'Você dominou os 7 primeiros passos do SINGU.',
      });
    } catch {
      /* noop */
    }
  }, [allComplete]);

  if (dismissed || allComplete) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_DISMISSED, 'true');
  };

  const nextStep = steps.find((s) => !s.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/20 bg-card/60 backdrop-blur-xl shadow-soft hover:border-primary/30 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0 shadow-inner-sm">
            {completedCount >= 5 ? (
              <Trophy className="w-5 h-5 text-warning animate-bounce" aria-hidden="true" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" aria-hidden="true" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Typography variant="small" className="font-heading font-bold text-foreground uppercase tracking-widest text-[10px]">
                Início de Jornada
              </Typography>
              <span className="text-xs text-muted-foreground tabular-nums">
                {completedCount}/{steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-1.5 mt-2 bg-primary/10" />
          </div>

          {!isOpen && nextStep && (
            <Link to={nextStep.path} className="hidden sm:block">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                {nextStep.label}
                <span className="text-muted-foreground">→</span>
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={isOpen ? 'Recolher' : 'Expandir'}
              >
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Fechar checklist"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-2">
            {steps.map((step, idx) => {
              const Icon = step.completed ? CheckCircle2 : step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                >
                  <Link to={step.path}>
                    <div
                      className={cn(
                        'flex flex-col gap-2 p-4 rounded-2xl border border-border/30 bg-background/40 backdrop-blur-sm transition-all duration-300 hover:bg-background/80 hover:border-primary/30 hover:shadow-soft hover:-translate-y-1 h-full group',
                        step.completed && 'opacity-60',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'p-1.5 rounded-md shrink-0',
                            step.completed ? 'text-success' : 'text-muted-foreground bg-muted',
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
                          {idx + 1}/7
                        </span>
                      </div>
                      <p className={cn('text-xs font-medium truncate', step.completed && 'line-through')}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{step.description}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
});
