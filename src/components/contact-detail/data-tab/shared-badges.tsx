import { Star, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return null;
  const color = value >= 80 ? 'text-success' : value >= 50 ? 'text-warning' : 'text-destructive';
  return <span className={cn('text-xs font-medium', color)}>{value}%</span>;
}

export function PrimaryBadge({ isPrimary }: { isPrimary?: boolean }) {
  if (!isPrimary) return null;
  return (
    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
      <Star className="h-3 w-3 mr-0.5" />Principal
    </Badge>
  );
}

export function VerifiedBadge({ isVerified }: { isVerified?: boolean }) {
  if (!isVerified) return null;
  return <BadgeCheck className="h-3.5 w-3.5 text-success" />;
}

export function SourceBadge({ fonte }: { fonte?: string }) {
  if (!fonte) return null;
  return <Badge variant="secondary" className="text-[10px]">{fonte.replace(/_/g, ' ')}</Badge>;
}
