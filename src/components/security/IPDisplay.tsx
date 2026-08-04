import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { maskIP } from '@/lib/ipMasking';
import { useIPMaskingPreference } from '@/hooks/useIPMaskingPreference';

interface IPDisplayProps {
  ip: string | null | undefined;
  className?: string;
  showToggle?: boolean;
}

export function IPDisplay({ ip, className, showToggle = false }: IPDisplayProps) {
  const { masked, toggle } = useIPMaskingPreference();
  const display = masked ? maskIP(ip) : (ip ?? '—');

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span title={ip ?? undefined}>{display}</span>
      {showToggle && (
        <button
          type="button"
          onClick={toggle}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={masked ? 'Mostrar IPs' : 'Mascarar IPs'}
          title={masked ? 'Mostrar IPs' : 'Mascarar IPs'}
        >
          {masked ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      )}
    </span>
  );
}
