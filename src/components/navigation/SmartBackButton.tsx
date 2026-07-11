import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

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

  // Deriva um rótulo curto a partir do último segmento da rota anterior.
  const derivedLabel = (() => {
    if (!previousPath) return null;
    const seg = previousPath.split('?')[0].split('/').filter(Boolean).pop();
    if (!seg) return 'Início';
    return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
  })();

  const computedLabel = label ?? (derivedLabel ? `Voltar para ${derivedLabel}` : 'Voltar');

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