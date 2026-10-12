import { Helmet } from 'react-helmet-async';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { TwoFactorSetup } from '@/components/security/TwoFactorSetup';
import { PasskeyManager } from '@/components/security/PasskeyManager';
import { IPRestrictionManager } from '@/components/security/IPRestrictionManager';
import { GeoBlockingManager } from '@/components/security/GeoBlockingManager';
import { SecuritySettings } from '@/components/security/SecuritySettings';
import { PushNotificationSettings } from '@/components/security/PushNotificationSettings';
import { Key, Globe, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useIPMaskingPreference } from '@/hooks/useIPMaskingPreference';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Security({ recoveryOnly = false }: { recoveryOnly?: boolean }) {
  const { masked, setMasked } = useIPMaskingPreference();
  const location = useLocation();
  const navigate = useNavigate();
  const handleVerified = () => {
    const state = location.state as { mfaRequired?: boolean; from?: string } | null;
    if (!state?.mfaRequired) return;
    let destination = '/';
    try {
      const target = new URL(state.from ?? '/', window.location.origin);
      if (target.origin === window.location.origin && !['/seguranca', '/auth'].includes(target.pathname)) {
        destination = target.pathname + target.search + target.hash;
      }
    } catch { /* Retorno padrão para um destino inválido. */ }
    navigate(destination, { replace: true });
  };
  if (recoveryOnly) {
    return <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Confirme seu acesso</h1>
      <TwoFactorSetup onVerified={handleVerified} />
    </div>;
  }
  return (
    <>
      <Helmet>
        <title>Segurança · SINGU CRM</title>
        <meta name="description" content="Gerencie configurações de segurança da sua conta" />
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Segurança</h1>
            <p className="text-sm text-muted-foreground">Proteja sua conta com múltiplas camadas de segurança</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Switch id="mask-ips" checked={masked} onCheckedChange={setMasked} />
            <Label htmlFor="mask-ips" className="text-xs text-muted-foreground cursor-pointer">Mascarar IPs</Label>
          </div>
        </header>

        <SecurityDashboard />

        <Tabs defaultValue="auth" className="w-full">
          <TabsList>
            <TabsTrigger value="auth" className="gap-2"><Key className="h-3.5 w-3.5" />Autenticação</TabsTrigger>
            <TabsTrigger value="access" className="gap-2"><Globe className="h-3.5 w-3.5" />Acesso</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="h-3.5 w-3.5" />Geral</TabsTrigger>
          </TabsList>
          <TabsContent value="auth" className="mt-4 space-y-4">
            <TwoFactorSetup onVerified={handleVerified} />
            <PasskeyManager />
          </TabsContent>
          <TabsContent value="access" className="mt-4 space-y-4">
            <IPRestrictionManager />
            <GeoBlockingManager />
          </TabsContent>
          <TabsContent value="settings" className="mt-4 space-y-4">
            <SecuritySettings />
            <PushNotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
