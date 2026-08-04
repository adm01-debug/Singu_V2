import { useState, useEffect, useCallback, useRef } from 'react';

interface UseOnlineStatusOptions {
  /** Callback when connection is lost */
  onOffline?: () => void;
  /** Callback when connection is restored */
  onOnline?: () => void;
  /** Check interval in ms (default: 30000) */
  pingInterval?: number;
}

interface UseOnlineStatusReturn {
  /** Whether the browser is online */
  isOnline: boolean;
  /** Whether we're checking connection status */
  isChecking: boolean;
  /** Last time connection was checked */
  lastChecked: Date | null;
  /** Manually trigger a connection check */
  checkConnection: () => Promise<boolean>;
}

/**
 * Hook to track online/offline status with optional ping checks
 */
export function useOnlineStatus(options: UseOnlineStatusOptions = {}): UseOnlineStatusReturn {
  const { onOffline, onOnline, pingInterval } = options;
  
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const pingAbortRef = useRef<AbortController | null>(null);

  // Check connection with a simple fetch
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined') return true;

    pingAbortRef.current?.abort();
    const controller = new AbortController();
    pingAbortRef.current = controller;

    setIsChecking(true);

    try {
      // Use a small favicon or similar resource to check connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      
      const online = response.ok;
      setLastChecked(new Date());
      
      if (online !== isOnline) {
        setIsOnline(online);
        if (online) {
          onOnline?.();
        } else {
          onOffline?.();
        }
      }
      
      return online;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false;
      setLastChecked(new Date());

      if (isOnline) {
        setIsOnline(false);
        onOffline?.();
      }

      return false;
    } finally {
      setIsChecking(false);
    }
  }, [isOnline, onOnline, onOffline]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  // Optional periodic ping check
  useEffect(() => {
    if (!pingInterval) return;

    const interval = setInterval(() => {
      checkConnection();
    }, pingInterval);

    return () => {
      clearInterval(interval);
      pingAbortRef.current?.abort();
    };
  }, [pingInterval, checkConnection]);

  return {
    isOnline,
    isChecking,
    lastChecked,
    checkConnection,
  };
}

export default useOnlineStatus;
