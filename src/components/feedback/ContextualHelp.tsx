import { ReactNode, useState } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextualHelpProps {
  /** Title of the help tooltip */
  title: string;
  /** Description text */
  description: string;
  /** Optional link to learn more */
  learnMoreUrl?: string;
  /** Optional additional content */
  children?: ReactNode;
  /** Size of the help icon */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as popover instead of tooltip */
  asPopover?: boolean;
  /** Alignment of the content */
  align?: 'start' | 'center' | 'end';
  /** Side of the trigger */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Custom trigger element */
  trigger?: ReactNode;
  /** Additional class name for the trigger */
  className?: string;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function ContextualHelp({
  title,
  description,
  learnMoreUrl,
  children,
  size = 'sm',
  asPopover = false,
  align = 'center',
  side = 'top',
  trigger,
  className,
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const triggerElement = trigger || (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'text-muted-foreground hover:text-foreground transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      aria-label={`Ajuda: ${title}`}
    >
      <HelpCircle className={sizeClasses[size]} />
    </button>
  );

  const content = (
    <div className="space-y-2">
      <div className="font-medium text-sm text-foreground">{title}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      {children}
      {learnMoreUrl && (
        <a
          href={learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
        >
          Saiba mais
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );

  if (asPopover) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {triggerElement}
        </PopoverTrigger>
        <PopoverContent 
          className="w-72 p-3" 
          align={align} 
          side={side}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">{content}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1 -mt-1"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {triggerElement}
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-xs p-3" 
          align={align} 
          side={side}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline help text that appears below a form field
 */
export function InlineHelp({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-xs text-muted-foreground mt-1', className)}>
      {children}
    </p>
  );
}

/**
 * Feature highlight tooltip for new features
 */
export function FeatureHighlight({
  title,
  description,
  children,
  isNew = true,
  onDismiss,
}: {
  title: string;
  description: string;
  children: ReactNode;
  isNew?: boolean;
  onDismiss?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return <>{children}</>;
  }

  return (
    <Popover defaultOpen={isNew}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="bottom" align="start">
        <div className="flex items-start gap-2">
          <span className="text-lg">✨</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{title}</span>
              {isNew && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  NOVO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs mt-2 h-7 px-2"
              onClick={() => {
                setDismissed(true);
                onDismiss?.();
              }}
            >
              Entendi
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ContextualHelp;
