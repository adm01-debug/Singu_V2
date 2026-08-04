import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAriaLiveRegion } from '@/components/feedback/AriaLiveRegion';

/**
 * Combines toast notifications with ARIA live region announcements
 * for accessible feedback on async operations.
 */
export function useAccessibleToast() {
  const { announce } = useAriaLiveRegion();

  const success = useCallback((message: string) => {
    toast.success(message);
    announce(message, 'polite');
  }, [announce]);

  const error = useCallback((message: string) => {
    toast.error(message);
    announce(message, 'assertive');
  }, [announce]);

  const info = useCallback((message: string) => {
    toast.info(message);
    announce(message, 'polite');
  }, [announce]);

  const warning = useCallback((message: string) => {
    toast.warning(message);
    announce(message, 'polite');
  }, [announce]);

  return { success, error, info, warning };
}
