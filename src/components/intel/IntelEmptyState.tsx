import { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntelEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Empty state padrão do Intelligence Hub. Substitui os "── NO_DATA ──" genéricos
 * por bloco com ícone, título, descrição e CTA contextual.
 */
export const IntelEmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: IntelEmptyStateProps) => {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center text-center py-8 px-4 gap-2',
        className
      )}
    >
      <div className="h-10 w-10 rounded-sm border border-[hsl(var(--intel-border))] bg-[hsl(var(--intel-surface-1)/0.6)] flex items-center justify-center">
        <Icon className="h-5 w-5 text-[hsl(var(--intel-accent))]" aria-hidden />
      </div>
      <div className="intel-mono text-[11px] uppercase tracking-wider text-foreground">
        {title}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
