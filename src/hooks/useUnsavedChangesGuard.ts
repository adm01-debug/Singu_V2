  import { useEffect } from 'react';

/**
 * Hook that warns users before navigating away when there are unsaved changes.
 * Uses beforeunload for browser/tab close warnings.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean, message?: string) {
  const defaultMessage = 'Você tem alterações não salvas. Deseja realmente sair?';
  const warningMessage = message || defaultMessage;

  // Handle browser/tab close
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = warningMessage;
      return warningMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, warningMessage]);

    return {
      isBlocked: false,
    };
}
