import { cn } from '@/lib/utils';
import { IntelBadge } from './IntelBadge';
import { ReactNode } from 'react';

interface EntityCardProps {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  chips?: Array<{ label: string; value: string; severity?: 'critical' | 'warn' | 'info' | 'ok' | 'neutral' }>;
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const EntityCard = ({
  type,
  id,
  title,
  subtitle,
  chips = [],
  actions,
  onClick,
  className,
}: EntityCardProps) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={cn(
        'intel-card intel-card-hover w-full text-left transition-colors group',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-border">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <IntelBadge severity="info">{type}</IntelBadge>
            <span className="intel-mono text-[10px] text-muted-foreground truncate">
              {id.slice(0, 8)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-[hsl(var(--intel-accent))]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-2">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 text-[10px]"
            >
              <span className="intel-eyebrow">{chip.label}</span>
              <span className="intel-mono text-foreground">{chip.value}</span>
            </span>
          ))}
        </div>
      )}
      {actions && (
        <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-t border-border">
          {actions}
        </div>
      )}
    </Component>
  );
};
