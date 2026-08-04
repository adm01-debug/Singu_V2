import { cn } from '@/lib/utils';
import { SentimentType } from '@/types';
import { Smile, Meh, Frown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const sentimentConfig: Record<SentimentType, { icon: typeof Smile; className: string; label: string }> = {
  positive: { icon: Smile, className: 'text-success', label: 'Positivo' },
  neutral: { icon: Meh, className: 'text-warning', label: 'Neutro' },
  negative: { icon: Frown, className: 'text-destructive', label: 'Negativo' },
};

interface SentimentIndicatorProps {
  sentiment: SentimentType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SentimentIndicator({ sentiment, showLabel, size = 'md', className }: SentimentIndicatorProps) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn('flex items-center gap-1.5', className)}
          role="img"
          aria-label={`Sentimento: ${config.label}`}
        >
          <Icon className={cn(sizeClasses[size], config.className)} aria-hidden="true" />
          {showLabel && (
            <span className={cn('text-sm font-medium', config.className)}>
              {config.label}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Sentimento: {config.label}
      </TooltipContent>
    </Tooltip>
  );
}
