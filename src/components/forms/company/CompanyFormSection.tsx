import { cn } from '@/lib/utils';

export function FormSection({ icon: Icon, title, children, className }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        {children}
      </div>
    </div>
  );
}
