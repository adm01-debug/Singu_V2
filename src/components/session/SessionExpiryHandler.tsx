import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface SessionExpiryHandlerProps {
  /** Warning shown X minutes before expiry */
  warningMinutes?: number;
  /** Auto-refresh session when idle */
  autoRefresh?: boolean;
  children?: React.ReactNode;
}

export function SessionExpiryHandler({
  warningMinutes = 5,
  autoRefresh = true,
  children,
}: SessionExpiryHandlerProps) {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSession = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        setShowWarning(false);
        setExpiresIn(null);
        toast.success('Sessão renovada com sucesso');
        return true;
      }
      return false;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error refreshing session:', { error: msg });
      toast.error('Erro ao renovar sessão', { description: msg });
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleSignOut = async () => {
    setShowWarning(false);
    await signOut();
  };

  // Monitor session expiry
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const checkExpiry = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session) {
        setShowWarning(true);
        setExpiresIn(0);
        return;
      }

      const expiresAt = session.expires_at;
      if (!expiresAt) return;

      const now = Math.floor(Date.now() / 1000);
      const secondsUntilExpiry = expiresAt - now;
      const minutesUntilExpiry = Math.floor(secondsUntilExpiry / 60);

      if (minutesUntilExpiry <= warningMinutes && minutesUntilExpiry > 0) {
        setExpiresIn(minutesUntilExpiry);
        setShowWarning(true);
      } else if (minutesUntilExpiry <= 0) {
        setExpiresIn(0);
        setShowWarning(true);
      } else if (autoRefresh && minutesUntilExpiry <= warningMinutes * 2) {
        await refreshSession();
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const intervalId = setInterval(checkExpiry, 60 * 1000);

    return () => { cancelled = true; clearInterval(intervalId); };
  }, [user, warningMinutes, autoRefresh, refreshSession]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        setShowWarning(false);
        setExpiresIn(null);
      }
      if (event === 'SIGNED_OUT') {
        setShowWarning(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Countdown timer when warning is shown
  useEffect(() => {
    if (!showWarning || expiresIn === null || expiresIn === 0) return;

    const intervalId = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [showWarning, expiresIn]);

  return (
    <>
      {children}

      {showWarning && (
          <Dialog open={showWarning} onOpenChange={setShowWarning}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </motion.div>
                  {expiresIn === 0 ? 'Sessão Expirada' : 'Sessão Expirando'}
                </DialogTitle>
                <DialogDescription>
                  {expiresIn === 0 ? (
                    'Sua sessão expirou. Por favor, faça login novamente para continuar.'
                  ) : (
                    <>
                      Sua sessão expira em{' '}
                      <span className="font-semibold text-foreground">
                        {expiresIn} {expiresIn === 1 ? 'minuto' : 'minutos'}
                      </span>
                      . Suas alterações não salvas podem ser perdidas.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              {expiresIn !== 0 && (
                <motion.div 
                  className="flex items-center justify-center py-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="relative">
                    <motion.div
                      className="w-20 h-20 rounded-full border-4 border-warning/30"
                      style={{ borderTopColor: 'hsl(var(--warning))' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-warning" />
                    </div>
                  </div>
                </motion.div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {expiresIn === 0 ? (
                  <Button onClick={handleSignOut} className="w-full sm:w-auto">
                    <LogOut className="h-4 w-4 mr-2" />
                    Fazer Login Novamente
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="w-full sm:w-auto"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                    <Button
                      onClick={refreshSession}
                      disabled={isRefreshing}
                      className="w-full sm:w-auto"
                    >
                      {isRefreshing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Renovar Sessão
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
    </>
  );
}

export default SessionExpiryHandler;
