import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionFrameProps {
  title: string;
  meta?: string;
  count?: number;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  cornerFrame?: boolean;
}

export const SectionFrame = ({
  title,
  meta,
  count,
  actions,
  children,
  className,
  cornerFrame = false,
}: SectionFrameProps) => {
  return (
    <section
      className={cn(
        'intel-card',
        cornerFrame && 'intel-corner-frame',
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="intel-eyebrow truncate">{title}</span>
          {typeof count === 'number' && (
            <span className="intel-mono text-[10px] text-muted-foreground">
              [{count.toString().padStart(3, '0')}]
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {meta && <span className="intel-mono text-[10px] text-muted-foreground">{meta}</span>}
          {actions}
        </div>
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
};
