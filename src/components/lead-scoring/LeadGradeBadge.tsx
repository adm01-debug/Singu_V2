import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { LeadScoreGrade } from '@/hooks/useLeadScoring';

interface Props {
  grade: string;
  size?: 'sm' | 'md' | 'lg';
}

const STYLES: Record<string, string> = {
  A: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  B: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  C: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  D: 'bg-muted text-muted-foreground border-border',
};

const LABEL: Record<string, string> = { A: 'A — Hot', B: 'B — Warm', C: 'C — Cool', D: 'D — Cold' };

const SIZES = {
  sm: 'text-[10px] px-1.5 py-0',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

function LeadGradeBadgeInner({ grade, size = 'md' }: Props) {
  const g = (['A','B','C','D'].includes(grade) ? grade : 'D') as LeadScoreGrade;
  return (
    <Badge variant="outline" className={`${STYLES[g]} ${SIZES[size]} font-semibold border`}>
      {LABEL[g]}
    </Badge>
  );
}

export const LeadGradeBadge = memo(LeadGradeBadgeInner);
