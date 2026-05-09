import { cn } from '@/lib/utils';
import { RelationshipStage, RELATIONSHIP_STAGE_LABELS } from '@/types';
import { motion } from 'framer-motion';

const stageColors: Record<RelationshipStage, string> = {
  unknown: 'bg-muted/60 text-muted-foreground border-border/50',
  prospect: 'bg-slate-500/10 text-slate-600 border-slate-200',
  qualified_lead: 'bg-blue-500/10 text-blue-600 border-blue-200',
  opportunity: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  negotiation: 'bg-amber-500/10 text-amber-600 border-amber-200',
  customer: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  loyal_customer: 'bg-emerald-600/15 text-emerald-700 border-emerald-300',
  advocate: 'bg-purple-500/10 text-purple-600 border-purple-200',
  at_risk: 'bg-red-500/10 text-red-600 border-red-200',
  lost: 'bg-gray-500/10 text-gray-600 border-gray-200',
};


const stageOrder: RelationshipStage[] = [
  'unknown',
  'prospect',
  'qualified_lead',
  'opportunity',
  'negotiation',
  'customer',
  'loyal_customer',
  'advocate',
  'at_risk',
  'lost'
];


interface RelationshipStageBadgeProps {
  stage: RelationshipStage;
  className?: string;
}

export function RelationshipStageBadge({ stage, className }: RelationshipStageBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        stageColors[stage],
        className
      )}
    >
      {RELATIONSHIP_STAGE_LABELS[stage]}
    </span>
  );
}

interface RelationshipFunnelProps {
  currentStage: RelationshipStage;
  onStageChange?: (stage: RelationshipStage) => void;
  className?: string;
  isEditable?: boolean;
}

export function RelationshipFunnel({ currentStage, onStageChange, className, isEditable = false }: RelationshipFunnelProps) {
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1">
        {stageOrder.map((stage, index) => {
          const isPast = index < currentIndex;
          const isCurrent = stage === currentStage;
          const isFuture = index > currentIndex;

          return (
            <div key={stage} className={cn("flex items-center flex-1", isEditable && "cursor-pointer")} onClick={() => isEditable && onStageChange?.(stage)}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'h-2 flex-1 rounded-full transition-all duration-300',
                  isPast && 'bg-success/60',
                  isCurrent && 'bg-primary ring-2 ring-primary/20 ring-offset-1',
                  isFuture && 'bg-muted'
                )}
                whileHover={isEditable ? { scaleY: 1.5 } : {}}
              />
              {index < stageOrder.length - 1 && (
                <div className={cn(
                  'w-1 h-1 rounded-full mx-0.5',
                  index < currentIndex ? 'bg-success' : 'bg-muted'
                )} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-tighter">
        <span>Prospect</span>
        <span>Negociação</span>
        <span>Fiel</span>
        <span>Perdido</span>
      </div>

    </div>
  );
}
