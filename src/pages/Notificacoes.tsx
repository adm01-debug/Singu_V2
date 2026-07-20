import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { motion } from 'framer-motion';
import { Bell, BellOff, Download, Smartphone, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SmartRemindersPanel } from '@/components/smart-reminders/SmartRemindersPanel';
import { logger } from "@/lib/logger";
import { NotificationSettingsSection } from './notificacoes/NotificationSettingsSection';
import { NotificationInstructions } from './notificacoes/NotificationInstructions';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Notificacoes = () => {
  usePageTitle('Notificações');
  const { user } = useAuth();
  const { permissionState, isSubscribed, isLoading, requestPermission, unsubscribe, showNotification } = useNotifications();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    followUps: true, birthdays: true, insights: true, weeklyDigest: false, relationshipDecay: true,
  });

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { setIsInstalled(true); toast({ title: 'App instalado!', description: 'O SINGU foi adicionado à sua tela inicial.' }); }
    setDeferredPrompt(null);
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const success = await showNotification('🔔 Teste de Notificação', { body: 'As notificações push estão funcionando corretamente! 🎉', tag: 'test-notification', data: { type: 'test' } });
      if (success) toast({ title: 'Notificação enviada!', description: 'Verifique suas notificações do sistema.' });
    } finally { setIsTesting(false); }
  };

  const handleToggleSubscription = async () => { if (isSubscribed) await unsubscribe(); else await requestPermission(); };

  const handleSettingChange = async (key: keyof typeof notificationSettings) => {
    const newSettings = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    try {
      if (user) await supabase.from('profiles').update({ preferences: { notifications: newSettings } }).eq('id', user.id);
    } catch (error) { 
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error saving notification settings:', { error: msg }); 
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      try {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) setNotificationSettings(JSON.parse(saved));
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle();
          if (cancelled) return;
          if (profile?.preferences) {
            const prefs = profile.preferences as { notifications?: typeof notificationSettings };
            if (prefs.notifications) { setNotificationSettings(prefs.notifications); localStorage.setItem('notificationSettings', JSON.stringify(prefs.notifications)); }
          }
        }
      } catch (error) {
        if (cancelled) return;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error loading notification settings:', { error: msg });
      }
    };
    loadSettings();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLayout>
      <SEOHead title="Notificações" description="Central de alertas e notificações do sistema" />
      <Header title="Notificações" subtitle="Configure alertas e notificações push" hideBack />
      <div className="p-6 space-y-6">
        {/* Install PWA Card */}
        {!isInstalled && deferredPrompt && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full"><Smartphone className="w-6 h-6 text-primary" /></div>
                    <div><h3 className="font-semibold text-foreground">Instalar App</h3><p className="text-sm text-muted-foreground">Adicione o SINGU à sua tela inicial para acesso rápido e notificações</p></div>
                  </div>
                  <Button onClick={handleInstall} className="gap-2"><Download className="w-4 h-4" />Instalar</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isInstalled && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-success/50 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/10 rounded-full"><Check className="w-6 h-6 text-success" /></div>
                  <div><h3 className="font-semibold text-foreground">App Instalado</h3><p className="text-sm text-muted-foreground">O SINGU está instalado no seu dispositivo</p></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notification Permission Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isSubscribed ? <Bell className="w-5 h-5 text-success" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
                    Push Notifications
                  </CardTitle>
                  <CardDescription>Receba alertas mesmo com o navegador fechado</CardDescription>
                </div>
                {isSubscribed && <Badge variant="outline" className="bg-success/10 text-success border-success/30">Ativo</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!permissionState.supported ? (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg"><AlertCircle className="w-5 h-5 text-destructive" /><p className="text-sm text-destructive">Seu navegador não suporta notificações push.</p></div>
              ) : permissionState.permission === 'denied' ? (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg"><X className="w-5 h-5 text-destructive" /><div><p className="text-sm font-medium text-destructive">Notificações bloqueadas</p><p className="text-xs text-muted-foreground mt-1">Para ativar, altere as permissões nas configurações do navegador.</p></div></div>
              ) : isSubscribed ? (
                <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                  <div className="flex items-center gap-3"><Check className="w-5 h-5 text-success" /><div><p className="text-sm font-medium text-success">Notificações push ativadas</p><p className="text-xs text-muted-foreground">Você receberá alertas de follow-ups, aniversários e insights</p></div></div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleTestNotification} disabled={isTesting}>{isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Testar'}</Button>
                    <Button variant="ghost" size="sm" onClick={handleToggleSubscription} disabled={isLoading} className="text-muted-foreground">Desativar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div><p className="font-medium text-foreground">Ativar notificações push</p><p className="text-sm text-muted-foreground">Receba alertas mesmo quando o app estiver fechado</p></div>
                  <Button onClick={requestPermission} disabled={isLoading}>{isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ativando...</>) : 'Ativar'}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}><SmartRemindersPanel /></motion.div>

        <NotificationSettingsSection settings={notificationSettings} isSubscribed={isSubscribed} onSettingChange={handleSettingChange} />
        <NotificationInstructions />
      </div>
    </AppLayout>
  );
};

export default Notificacoes;
