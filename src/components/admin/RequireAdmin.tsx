import { ReactNode } from "react";
import { Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageLoadingFallback } from "@/components/feedback/PageLoadingFallback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { logger } from "@/lib/logger";

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Gate component que checa user_roles para 'admin'.
 * Redireciona não-admins para home. Mostra banner MFA quando admin sem 2FA.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["user-role-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (error) {
        if (import.meta.env.DEV) logger.warn("Role check error:", error.message);
        return false;
      }
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: mfaEnrolled } = useQuery({
    queryKey: ["mfa-enrolled", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return true; // fail-open: não mostrar banner em caso de erro
      return (data?.totp?.length ?? 0) > 0 || (data?.all?.length ?? 0) > 0;
    },
    enabled: !!user && !!isAdmin,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <PageLoadingFallback />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <>
      {mfaEnrolled === false && (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>MFA não configurado</AlertTitle>
          <AlertDescription>
            Como administrador, você deve ativar autenticação em duas etapas.{" "}
            <Link to="/configuracoes/seguranca" className="underline font-medium">
              Configurar agora
            </Link>
          </AlertDescription>
        </Alert>
      )}
      {children}
    </>
  );
}
