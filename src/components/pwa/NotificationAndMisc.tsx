import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, RefreshCw, Share2, Bell, BellOff, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Update Available Banner
export function UpdateAvailable({ onUpdate }: { onUpdate: () => void }) {
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShow(true);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleUpdate);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleUpdate);
      }
    };
  }, []);

  const handleUpdateClick = async () => {
    setUpdating(true);
    try {
      await onUpdate();
      window.location.reload();
    } catch {
      setUpdating(false);
    }
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground py-2 px-4"
    >
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm font-medium">Nova versão disponível!</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleUpdateClick}
          disabled={updating}
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          {updating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar agora
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// iOS Install Instructions
export function IOSInstallInstructions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = sessionStorage.getItem('ios-install-dismissed');
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShow(true), 10000);
    }
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-4 left-4 right-4 z-50"
    >
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Instalar SINGU</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Toque em <Share2 className="h-3 w-3 inline" /> e depois em "Adicionar à Tela de Início"
              </p>
            </div>
            <button
              onClick={() => {
                setShow(false);
                sessionStorage.setItem('ios-install-dismissed', 'true');
              }}
              className="p-1 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Notification Permission Request
export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
    if (Notification.permission === 'default') {
      const dismissed = sessionStorage.getItem('notification-prompt-dismissed');
      if (!dismissed) {
        setTimeout(() => setShow(true), 60000);
      }
    }
  }, []);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    setShow(false);
  };

  if (permission !== 'default' || !show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50 w-80"
    >
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Ativar notificações?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Receba alertas sobre follow-ups, aniversários e insights importantes
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={requestPermission}>
                  <Bell className="h-4 w-4 mr-1" />
                  Ativar
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setShow(false);
                    sessionStorage.setItem('notification-prompt-dismissed', 'true');
                  }}
                >
                  <BellOff className="h-4 w-4 mr-1" />
                  Não
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// App Loading/Splash Screen
export function AppSplashScreen({ progress = 0 }: { progress?: number }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <span className="text-3xl font-bold text-primary">R</span>
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground mb-2">SINGU</h1>
        <p className="text-primary-foreground/80 text-sm mb-8">Inteligência Relacional</p>
        <div className="w-48">
          <Progress value={progress} className="h-1 bg-primary-foreground/20" />
        </div>
        <p className="text-primary-foreground/60 text-xs mt-2">
          {progress < 100 ? 'Carregando...' : 'Pronto!'}
        </p>
      </motion.div>
    </motion.div>
  );
}

// Share Target Handler
// eslint-disable-next-line react-refresh/only-export-components
export function useShareTarget() {
  const [sharedData, setSharedData] = useState<{
    title?: string;
    text?: string;
    url?: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');
    const text = params.get('text');
    const url = params.get('url');

    if (title || text || url) {
      setSharedData({ 
        title: title || undefined, 
        text: text || undefined, 
        url: url || undefined 
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const clearSharedData = () => setSharedData(null);
  return { sharedData, clearSharedData };
}
