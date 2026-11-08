import { useState, useEffect, type FormEvent } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle, ShieldAlert } from 'lucide-react';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const pwSchema = z.string().min(6, 'Mínimo 6 caracteres');

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forced = searchParams.get('forced') === 'true';

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      toast.error('Link inválido ou expirado.');
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = pwSchema.safeParse(password);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (password !== confirm) { toast.error('Senhas não coincidem.'); return; }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Se foi um reset forçado pós-migração, limpar a flag must_reset_password
      if (forced) {
        try {
          await supabase.functions.invoke('clear-must-reset-flag');
        } catch (err) {
          logger.warn('clear-must-reset-flag falhou (não bloqueante):', err);
        }
      }

      setDone(true);
      toast.success('Senha alterada com sucesso!');
      setTimeout(() => navigate('/auth', { replace: true }), 2000);
    } catch {
      toast.error('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Redefinir Senha · SINGU CRM" description="Redefina sua senha de acesso." />
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>Escolha uma nova senha segura</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center space-y-3">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">Senha alterada! Redirecionando...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {forced && (
                  <Alert>
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Redefinição obrigatória</AlertTitle>
                    <AlertDescription>
                      Migramos o sistema para uma nova infraestrutura. Por segurança, defina uma
                      nova senha para continuar acessando sua conta.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <div className="relative">
                    <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar senha</Label>
                  <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Redefinir senha'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
