import { Button } from '@/components/ui/button';

interface Props {
  onRetry: () => void;
  isRetrying: boolean;
}

export function SocialInsightsError({ onRetry, isRetrying }: Props) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm">
      <p>Não foi possível carregar o histórico social.</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? 'Tentando novamente...' : 'Tentar novamente'}
      </Button>
    </div>
  );
}
