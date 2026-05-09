import { cn } from '@/lib/utils';
import { RelationshipStage, RELATIONSHIP_STAGE_LABELS } from '@/types';
import { motion } from 'framer-motion';

const stageColors: Record<RelationshipStage, string> = {
  unknown: 'bg-muted/60 text-muted-foreground border-border/50',
  prospect: 'bg-muted/50 text-muted-foreground border-border/40',
  qualified_lead: 'bg-primary/12 text-primary border-primary/20',
  opportunity: 'bg-accent/12 text-accent border-accent/20',
  negotiation: 'bg-secondary/12 text-secondary border-secondary/20',
  customer: 'bg-success/12 text-success border-success/20',
  loyal_customer: 'bg-success/18 text-success border-success/30',
  advocate: 'bg-success/22 text-success border-success/35',
  best_friend_forever: 'bg-primary/25 text-primary border-primary/40',
  fan_club: 'bg-primary/35 text-primary border-primary/50',
  at_risk: 'bg-warning/12 text-warning border-warning/20',
  lost: 'bg-destructive/12 text-destructive border-destructive/20',
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
  'best_friend_forever',
  'fan_club',
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
            <div key={stage} className="flex items-center flex-1">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  isPast && 'bg-success',
                  isCurrent && 'bg-primary',
                  isFuture && 'bg-muted'
                )}
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
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Prospect</span>
        <span>Cliente</span>
        <span>BFF</span>
        <span>Fã Clube</span>
      </div>
    </div>
  );
}
