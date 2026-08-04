import { cn } from '@/lib/utils';

interface KeyboardHintProps {
  keys: string[];
  className?: string;
}

/**
 * Renders keyboard shortcut hints as styled kbd elements.
 * Hidden on mobile (touch devices) by default.
 */
export function KeyboardHint({ keys, className }: KeyboardHintProps) {
  return (
    <span className={cn('hidden md:inline-flex items-center gap-0.5', className)}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="pointer-events-none h-5 min-w-[20px] select-none items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground inline-flex"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
