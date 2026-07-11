import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  id: string;
  label: string;
}

interface ProgressStepperProps {
  steps: ProgressStep[];
  currentIndex: number;
  className?: string;
}

/**
 * Stepper horizontal para fluxos multi-etapas (onboarding, importações, wizards).
 * Segmenta visualmente etapas concluídas, atual e pendentes.
 */
export const ProgressStepper = ({ steps, currentIndex, className }: ProgressStepperProps) => {
  return (
    <ol
      className={cn('flex w-full items-center gap-2', className)}
      aria-label="Progresso da etapa"
    >
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <div
              aria-current={current ? 'step' : undefined}
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                done && 'border-primary bg-primary text-primary-foreground',
                current && 'border-primary text-primary',
                !done && !current && 'border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
            </div>
            <span
              className={cn(
                'hidden truncate text-xs md:inline',
                current ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 transition-colors',
                  done ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default ProgressStepper;