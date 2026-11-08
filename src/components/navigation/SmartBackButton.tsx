import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { getReadableLabel } from '@/lib/navigationLabels';

interface SmartBackButtonProps {
  fallback?: string;
  label?: string;
  className?: string;
}

/**
 * Botão "Voltar" inteligente:
 * - Usa o NavigationStack para inferir o destino real (label dinâmico).
 * - Se pilha vazia, cai no fallback.
 * - Suporta gesto swipe-to-back nativo do iOS via history.back().
 */
export const SmartBackButton = ({ fallback = '/', label, className }: SmartBackButtonProps) => {
  const { goBack, previousPath } = useNavigationStack();

  const computedLabel = label ?? `Voltar para ${getReadableLabel(previousPath || fallback)}`;

  const handleClick = () => goBack(fallback);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn('gap-1.5 -ml-2', className)}
      aria-label={computedLabel}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{computedLabel}</span>
    </Button>
  );
};

export default SmartBackButton;