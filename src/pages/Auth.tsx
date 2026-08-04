import { useState, useEffect, type FormEvent } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { logger } from "@/lib/logger";
import { checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt, getRemainingAttempts, formatRetryTime } from '@/lib/rateLimiter';
import { AuthBranding } from './auth/AuthBranding';
import { parseApiError } from '@/lib/errorMessages';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres');

type AuthMode = 'login' | 'signup';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    const redirectTo = (location.state as { from?: string } | null)?.from || '/';
    navigate(redirectTo, { replace: true });
  }, [user, navigate, location.state]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }
    try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0].message; }
    if (mode === 'signup') {
      try { nameSchema.parse(firstName); } catch (e) { if (e instanceof z.ZodError) newErrors.firstName = e.errors[0].message; }
      try { nameSchema.parse(lastName); } catch (e) { if (e instanceof z.ZodError) newErrors.lastName = e.errors[0].message; }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (mode === 'login') {
      const { allowed, retryAfterSeconds } = checkRateLimit(email);
      if (!allowed && retryAfterSeconds) {
        toast.error(`Muitas tentativas. Tente novamente em ${formatRetryTime(retryAfterSeconds)}.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          const result = recordFailedAttempt(email);
          const remaining = getRemainingAttempts(email);
          if (result.lockedOut && result.retryAfterSeconds) {
            toast.error(`Conta temporariamente bloqueada. Tente novamente em ${formatRetryTime(result.retryAfterSeconds)}.`);
          } else if (remaining <= 2) {
            toast.error(`${parseApiError(error)} (${remaining} tentativa${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`);
          } else {
            toast.error(parseApiError(error));
          }
        } else {
          recordSuccessfulAttempt(email);
          const redirectTo = (location.state as { from?: string } | null)?.from || '/onboarding';
          toast.success('Bem-vindo de volta!');
          navigate(redirectTo, { replace: true });
        }
      } else {
        const { error, needsEmailVerification } = await signUp(email, password, { first_name: firstName, last_name: lastName });
        if (error) {
          toast.error(parseApiError(error));
        } else if (needsEmailVerification) {
          toast.success('Conta criada! Verifique seu email para ativar o acesso.');
          setMode('login');
          setPassword('');
        } else {
          toast.success('Conta criada com sucesso! Vamos configurar sua conta!');
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (error) {
      const msg = parseApiError(error, 'Não foi possível concluir a autenticação. Tente novamente.');
      logger.error('Auth submit error:', { error: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => { setMode(mode === 'login' ? 'signup' : 'login'); setErrors({}); };

  return (
    <>
      <SEOHead title="Login" description="Acesse o SINGU - CRM Inteligente de Relacionamentos" />
      <div className="min-h-screen flex">
        <AuthBranding />

        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SINGU</h1>
                <p className="text-xs text-muted-foreground">Inteligência Relacional</p>
              </div>
            </div>

            <Card className="border-border/30 shadow-md backdrop-blur-sm">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">{mode === 'login' ? 'Entrar' : 'Criar conta'}</CardTitle>
                <CardDescription>{mode === 'login' ? 'Acesse sua conta para continuar' : 'Preencha os dados para começar'}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <AnimatePresence mode="wait">
                    {mode === 'signup' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Nome</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input id="firstName" placeholder="João" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className={`pl-10 ${errors.firstName ? 'border-destructive' : ''}`} />
                          </div>
                          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Sobrenome</Label>
                          <Input id="lastName" placeholder="Silva" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" className={errors.lastName ? 'border-destructive' : ''} />
                          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={`pl-10 ${errors.email ? 'border-destructive' : ''}`} />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">{mode === 'login' ? 'Entrar' : 'Criar conta'}<ArrowRight className="w-4 h-4" /></span>
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">ou</span></div>
                </div>

                <Button type="button" variant="outline" className="w-full" onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                  if (error) { 
                    const msg = parseApiError(error, 'Erro ao entrar com Google');
                    toast.error(msg); 
                    logger.error('Google OAuth error:', { error: msg }); 
                  }
                }}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Entrar com Google
                </Button>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    <button type="button" onClick={toggleMode} className="ml-1 text-primary font-medium hover:underline">{mode === 'login' ? 'Criar conta' : 'Entrar'}</button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Auth;
