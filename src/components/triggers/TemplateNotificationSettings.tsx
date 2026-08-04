import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Target,
  Check,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTemplateNotifications } from '@/hooks/useTemplateNotifications';
import { toast } from 'sonner';
import { subscribeToPush, isPushSupported, getSubscriptionStatus } from '@/lib/pushNotifications';

type DISCProfile = 'D' | 'I' | 'S' | 'C';

const DISC_PROFILES: { id: DISCProfile; name: string; color: string }[] = [
  { id: 'D', name: 'Dominante', color: 'bg-destructive/10 text-destructive border-destructive' },
  { id: 'I', name: 'Influente', color: 'bg-warning/10 text-warning border-warning/30' },
  { id: 'S', name: 'Estável', color: 'bg-success/10 text-success border-success/30' },
  { id: 'C', name: 'Conforme', color: 'bg-info/10 text-info border-info' },
];

export function TemplateNotificationSettings({ className }: { className?: string }) {
  const { settings, loading, updateSettings, checkForHighPerformers } = useTemplateNotifications();
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Check push subscription status on mount
  useState(() => {
    if (isPushSupported()) {
      getSubscriptionStatus().then(({ isSubscribed }) => {
        setPushEnabled(isSubscribed);
      });
    }
  });

  const handleToggleEnabled = async (enabled: boolean) => {
    setSaving(true);
    
    if (enabled && !pushEnabled) {
      // Try to enable push notifications first
      const subscription = await subscribeToPush();
      if (!subscription) {
        toast.error('Não foi possível ativar notificações push. Verifique as permissões do navegador.');
        setSaving(false);
        return;
      }
      setPushEnabled(true);
    }
    
    const success = await updateSettings({ enabled });
    if (success) {
      toast.success(enabled ? 'Notificações ativadas!' : 'Notificações desativadas');
    } else {
      toast.error('Erro ao salvar configurações');
    }
    setSaving(false);
  };

  const handleUpdateMinSuccessRate = async (value: number[]) => {
    await updateSettings({ minSuccessRate: value[0] });
  };

  const handleUpdateMinUsages = async (value: number[]) => {
    await updateSettings({ minUsages: value[0] });
  };

  const handleToggleDISC = async (disc: DISCProfile) => {
    const currentProfiles = settings.discProfiles;
    let newProfiles: DISCProfile[];
    
    if (currentProfiles.includes(disc)) {
      // Don't allow removing the last profile
      if (currentProfiles.length === 1) {
        toast.error('Selecione pelo menos um perfil DISC');
        return;
      }
      newProfiles = currentProfiles.filter(p => p !== disc);
    } else {
      newProfiles = [...currentProfiles, disc];
    }
    
    await updateSettings({ discProfiles: newProfiles });
  };

  const handleCheckNow = async () => {
    setChecking(true);
    const result = await checkForHighPerformers();
    
    if (result) {
      if (result.notificationsSent > 0) {
        toast.success(`${result.notificationsSent} notificação(ões) enviada(s)!`);
      } else {
        toast.info('Nenhum template favorito com alta performance encontrado no momento.');
      }
    } else {
      toast.error('Erro ao verificar templates');
    }
    setChecking(false);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-5 h-5 text-primary" />
          Notificações de Templates
        </CardTitle>
        <CardDescription>
          Receba alertas quando seus templates favoritos tiverem alta taxa de sucesso com perfis DISC específicos.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Ativar notificações</Label>
            <p className="text-xs text-muted-foreground">
              Receba push notifications sobre templates de sucesso
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={saving}
          />
        </div>

        {!isPushSupported() && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-sm text-warning">
              ⚠️ Seu navegador não suporta notificações push.
            </p>
          </div>
        )}

        {settings.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6"
          >
            {/* Min Success Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Taxa de sucesso mínima</Label>
                <Badge variant="secondary">{settings.minSuccessRate}%</Badge>
              </div>
              <Slider
                value={[settings.minSuccessRate]}
                onValueCommit={handleUpdateMinSuccessRate}
                min={50}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Notificar quando templates tiverem sucesso acima de {settings.minSuccessRate}%
              </p>
            </div>

            {/* Min Usages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Usos mínimos</Label>
                <Badge variant="secondary">{settings.minUsages} usos</Badge>
              </div>
              <Slider
                value={[settings.minUsages]}
                onValueCommit={handleUpdateMinUsages}
                min={2}
                max={10}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Considerar apenas templates usados pelo menos {settings.minUsages} vezes
              </p>
            </div>

            {/* DISC Profiles */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Perfis DISC</Label>
              <div className="flex flex-wrap gap-2">
                {DISC_PROFILES.map((disc) => {
                  const isSelected = settings.discProfiles.includes(disc.id);
                  return (
                    <Button
                      key={disc.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleDISC(disc.id)}
                      className={cn(
                        'gap-1.5 transition-all',
                        isSelected && disc.color
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span className="font-bold">{disc.id}</span>
                      <span className="text-xs">{disc.name}</span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Receber notificações para estes perfis DISC
              </p>
            </div>

            {/* Check Now Button */}
            <Button
              variant="outline"
              onClick={handleCheckNow}
              disabled={checking}
              className="w-full gap-2"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Verificar agora
                </>
              )}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
