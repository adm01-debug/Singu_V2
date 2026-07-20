import { useState, useEffect, createContext, useContext, ReactNode, forwardRef, useCallback, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";
import { PageLoadingFallback } from '@/components/feedback/PageLoadingFallback';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => Promise<{ error: Error | null; needsEmailVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tempo antes da expiração para refresh automático (5 minutos)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHandling401Ref = useRef(false);
  const qc = useQueryClient();

  // Função para agendar refresh automático
  const scheduleTokenRefresh = useCallback((currentSession: Session | null) => {
    // Limpar timeout anterior
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!currentSession?.expires_at) return;

    const expiresAt = currentSession.expires_at * 1000; // Converter para ms
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshTime = timeUntilExpiry - REFRESH_THRESHOLD_MS;

    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        if (import.meta.env.DEV) logger.log('🔄 Refreshing session token...');
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            logger.error('Failed to refresh session:', error);
            // Sessão expirou, redirecionar para login
            toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          } else if (data.session) {
            if (import.meta.env.DEV) logger.log('✅ Session refreshed successfully');
            scheduleTokenRefresh(data.session);
          }
        } catch (err) {
          logger.error('Error refreshing session:', err);
        }
      }, refreshTime);
    } else if (timeUntilExpiry <= 0) {
      // Sessão já expirou
      if (import.meta.env.DEV) logger.warn('⚠️ Session already expired');
    }
  }, []);

  // Refresh manual da sessão
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        scheduleTokenRefresh(data.session);
      }
    } catch (err) {
      logger.error('Error refreshing session:', err);
      toast.error('Erro ao atualizar sessão.');
    }
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession) => {
        if (import.meta.env.DEV) logger.log('🔐 Auth event:', event);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // Tratar diferentes eventos de auth
        switch (event) {
          case 'SIGNED_IN':
            scheduleTokenRefresh(newSession);
            toast.success('Login realizado com sucesso!');
            break;
            
          case 'SIGNED_OUT':
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current);
              refreshTimeoutRef.current = null;
            }
            break;
            
          case 'TOKEN_REFRESHED':
            if (import.meta.env.DEV) logger.log('🔄 Token refreshed via auth event');
            scheduleTokenRefresh(newSession);
            break;
            
          case 'USER_UPDATED':
            toast.success('Perfil atualizado!');
            break;
            
          case 'PASSWORD_RECOVERY':
            toast.info('Siga as instruções para recuperar sua senha.');
            break;
        }
      }
    );

    // Check for existing session — always call setLoading(false) so app never stays stuck
    supabase.auth.getSession()
      .then(({ data: { session: existingSession } }) => {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setLoading(false);
        if (existingSession) {
          scheduleTokenRefresh(existingSession);
        }
      })
      .catch((err: unknown) => {
        logger.error('Failed to retrieve session:', err);
        setLoading(false);
      });

    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scheduleTokenRefresh]);

  // Interceptar erros 401 globalmente
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status !== 401) return response;

      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
      const isBackendRequest =
        url.includes('/auth/v1') || url.includes('/rest/v1') || url.includes('/functions/v1') || url.includes('supabase');
      const isRefreshRequest = url.includes('/auth/v1/token');

      if (!isBackendRequest || isRefreshRequest || isHandling401Ref.current) {
        return response;
      }

      logger.warn('⚠️ 401 Unauthorized - attempting session refresh');
      isHandling401Ref.current = true;

      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
        }
      } catch (err) {
        logger.error('Failed to handle 401:', err);
      } finally {
        isHandling401Ref.current = false;
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: new Error('Este email já está cadastrado. Tente fazer login.') };
        }
        return { error };
      }

      return { error: null, needsEmailVerification: !data.session };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Email ou senha incorretos.') };
        }
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    await supabase.auth.signOut();
    qc.clear();
    setUser(null);
    setSession(null);
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

const AUTH_FALLBACK: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: new Error('AuthProvider not mounted') }),
  signIn: async () => ({ error: new Error('AuthProvider not mounted') }),
  signOut: async () => {},
  refreshSession: async () => {},
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During HMR the provider may momentarily unmount; return a safe fallback
    // instead of throwing, which would crash the entire tree.
    if (import.meta.env.DEV) {
      return AUTH_FALLBACK;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route wrapper - using forwardRef to avoid ref warnings
interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth = forwardRef<HTMLDivElement, RequireAuthProps>(
  function RequireAuth({ children }, ref) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!loading && !user) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        navigate('/auth', { replace: true, state: { from: returnTo } });
      }
    }, [user, loading, navigate, location.pathname, location.search, location.hash]);

    if (loading) {
      return <div ref={ref}><PageLoadingFallback /></div>;
    }

    if (!user) {
      return null;
    }

    return <>{children}</>;
  }
);

RequireAuth.displayName = 'RequireAuth';
