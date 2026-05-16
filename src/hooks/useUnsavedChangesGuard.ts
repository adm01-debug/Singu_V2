 import { useEffect, useCallback } from 'react';
 import { unstable_useBlocker as useBlocker } from 'react-router-dom';

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

   // Handle client-side navigation (React Router)
   // Note: unstable_useBlocker is the current way to handle this in v6.4+
   const blocker = useBlocker(
     useCallback(
       ({ currentLocation, nextLocation }) =>
         hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
       [hasUnsavedChanges]
     )
   );
 
   useEffect(() => {
     if (blocker.state === 'blocked' && !hasUnsavedChanges) {
       blocker.reset();
     }
   }, [blocker, hasUnsavedChanges]);
 
   return {
     isBlocked: blocker.state === 'blocked',
     proceed: () => blocker.proceed?.(),
     reset: () => blocker.reset?.(),
   };
}
