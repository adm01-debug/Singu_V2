import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  RotateCcw, 
  CheckCircle2, 
  PlayCircle,
  Bell,
  BellOff,
  Smartphone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useOnboardingTour } from '@/components/onboarding/OnboardingTour';
import { 
  isPushSupported, 
  subscribeToPush, 
  unsubscribeFromPush, 
  getSubscriptionStatus 
} from '@/lib/pushNotifications';
import { logger } from "@/lib/logger";

export function TourPreferencesPanel() {
  const { hasCompleted, resetTour, startTour, isOpen } = useOnboardingTour('main');
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check push support
    setPushSupported(isPushSupported());
    
    // Check current permission and subscription status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    const { isSubscribed } = await getSubscriptionStatus();
    setIsPushEnabled(isSubscribed);
  };

  const handleTogglePush = async () => {
    setPushLoading(true);
    try {
      if (isPushEnabled) {
        // Unsubscribe
        const success = await unsubscribeFromPush();
        if (success) {
          setIsPushEnabled(false);
          toast.success('Push notifications desativadas');
        }
      } else {
        // Request permission first
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          setPermissionStatus(permission);
          if (permission !== 'granted') {
            toast.error('Permissão para notificações negada');
            return;
          }
        } else if (Notification.permission === 'denied') {
          toast.error('Notificações bloqueadas. Altere nas configurações do navegador.');
          return;
        }
        
        // Subscribe
        const subscription = await subscribeToPush();
        if (subscription) {
          setIsPushEnabled(true);
          toast.success('Push notifications ativadas!');
        } else {
          toast.error('Erro ao ativar push notifications');
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Push toggle error:', { error: msg });
      toast.error('Erro ao alterar configurações de push', { description: msg });
    } finally {
      setPushLoading(false);
    }
  };

  const handleResetTour = () => {
    resetTour();
    toast.success('Tour resetado! Será exibido na próxima vez que você acessar o app.');
  };

  const handleStartTour = () => {
    if (!isOpen) {
      startTour();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Onboarding Tour Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Tour de Onboarding
          </CardTitle>
          <CardDescription>
            Gerencie o tour interativo que apresenta as funcionalidades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {hasCompleted ? (
                <div className="p-2 rounded-full bg-success/10">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-warning/10">
                  <PlayCircle className="w-5 h-5 text-warning" />
                </div>
              )}
              <div>
                <p className="font-medium">Status do Tour</p>
                <p className="text-sm text-muted-foreground">
                  {hasCompleted 
                    ? 'Tour concluído ou pulado' 
                    : 'Tour ainda não foi completado'}
                </p>
              </div>
            </div>
            <Badge variant={hasCompleted ? 'secondary' : 'default'}>
              {hasCompleted ? 'Concluído' : 'Pendente'}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={handleResetTour}
              className="gap-2 flex-1"
              disabled={!hasCompleted}
            >
              <RotateCcw className="w-4 h-4" />
              Resetar Tour
            </Button>
            <Button 
              onClick={handleStartTour}
              className="gap-2 flex-1"
              disabled={isOpen}
            >
              <PlayCircle className="w-4 h-4" />
              Iniciar Tour Agora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Push Notifications Nativas
          </CardTitle>
          <CardDescription>
            Receba notificações mesmo quando o app estiver fechado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-3">
                <BellOff className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Não suportado</p>
                  <p className="text-sm text-muted-foreground">
                    Seu navegador não suporta push notifications
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isPushEnabled ? 'bg-success/10' : 'bg-muted'}`}>
                    {isPushEnabled ? (
                      <Bell className="w-5 h-5 text-success" />
                    ) : (
                      <BellOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      {isPushEnabled 
                        ? 'Ativadas - você receberá alertas em tempo real' 
                        : 'Desativadas - ative para receber alertas'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isPushEnabled}
                  onCheckedChange={handleTogglePush}
                  disabled={pushLoading || permissionStatus === 'denied'}
                />
              </div>

              {permissionStatus === 'denied' && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning-foreground">
                    ⚠️ Notificações bloqueadas. Para ativar, altere as permissões nas configurações do seu navegador.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Tipos de notificações push:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Alertas de saúde de relacionamento
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    Lembretes de follow-up
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-info" />
                    Datas importantes de contatos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Novos insights e recomendações
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default TourPreferencesPanel;
