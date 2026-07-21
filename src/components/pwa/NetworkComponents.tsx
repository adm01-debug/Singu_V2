import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Network Information API type (experimental)
interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleOnline = () => {
      setShowReconnecting(true);
      timer = setTimeout(() => {
        setIsOnline(true);
        setShowReconnecting(false);
      }, 1000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnecting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className={`py-2 px-4 text-center text-sm font-medium ${
        showReconnecting 
          ? 'bg-success text-success-foreground' 
          : 'bg-warning text-warning-foreground'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {showReconnecting ? (
            <>
              <Check className="h-4 w-4" />
              <span>Conexão restaurada!</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const NetworkStatusBadge = React.forwardRef<HTMLDivElement>(function NetworkStatusBadge(_, ref) {
  const [status, setStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const [effectiveType, setEffectiveType] = useState<string>('');

  useEffect(() => {
    const updateStatus = () => {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }
      const connection = navigator.connection;
      if (connection) {
        setEffectiveType(connection.effectiveType);
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setStatus('slow');
        } else {
          setStatus('online');
        }
      } else {
        setStatus('online');
      }
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = navigator.connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  if (status === 'online') return null;

  return (
    <div ref={ref} className="fixed bottom-4 left-4 z-40">
      <Badge variant={status === 'offline' ? 'destructive' : 'secondary'}>
        {status === 'offline' ? (
          <>
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </>
        ) : (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Conexão lenta ({effectiveType})
          </>
        )}
      </Badge>
    </div>
  );
});
