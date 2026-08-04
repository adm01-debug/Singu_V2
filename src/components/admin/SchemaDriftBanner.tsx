import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnresolvedDriftCount } from '@/hooks/useSchemaDriftAlerts';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';

export function SchemaDriftBanner() {
  const { isAdmin } = useIsAdmin();
  const { data: count = 0 } = useUnresolvedDriftCount();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (!isAdmin || count === 0 || dismissed) return null;

  return (
    <div className="bg-yellow-500/15 border-b border-yellow-500/30 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          <strong>{count}</strong> alerta{count > 1 ? 's' : ''} de schema drift detectado{count > 1 ? 's' : ''} no banco externo.
        </span>
        <Button
          variant="link"
          size="sm"
          className="text-yellow-700 dark:text-yellow-300 underline p-0 h-auto"
          onClick={() => navigate('/admin/schema-drift')}
        >
          Ver detalhes
        </Button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
        aria-label="Dispensar alerta"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
