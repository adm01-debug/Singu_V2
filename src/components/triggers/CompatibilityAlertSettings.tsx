import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  Save,
  Users,
  Target,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface CompatibilitySettings {
  alert_threshold: number;
  alert_only_important: boolean;
  important_min_relationship_score: number;
  email_notifications: boolean;
}

export function CompatibilityAlertSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CompatibilitySettings>({
    alert_threshold: 50,
    alert_only_important: true,
    important_min_relationship_score: 70,
    email_notifications: false,
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('compatibility_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setSettings({
          alert_threshold: data.alert_threshold,
          alert_only_important: data.alert_only_important ?? true,
          important_min_relationship_score: data.important_min_relationship_score ?? 70,
          email_notifications: data.email_notifications ?? false,
        });
      }
    } catch (err) {
      logger.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('compatibility_settings')
        .upsert({
          user_id: user.id,
          alert_threshold: settings.alert_threshold,
          alert_only_important: settings.alert_only_important,
          important_min_relationship_score: settings.important_min_relationship_score,
          email_notifications: settings.email_notifications,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast.success('Configurações de alerta salvas!', {
        description: `Você será alertado quando a compatibilidade cair abaixo de ${settings.alert_threshold}%`,
      });
    } catch (err) {
      logger.error('Error saving settings:', err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const getThresholdLevel = (value: number) => {
    if (value >= 70) return { label: 'Alto', color: 'text-warning', description: 'Poucos alertas, apenas casos críticos' };
    if (value >= 50) return { label: 'Médio', color: 'text-info', description: 'Alerta equilibrado' };
    return { label: 'Baixo', color: 'text-success', description: 'Mais alertas, monitoramento amplo' };
  };

  const thresholdLevel = getThresholdLevel(settings.alert_threshold);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Alertas de Compatibilidade
        </CardTitle>
        <CardDescription>
          Receba alertas quando a compatibilidade com clientes importantes cair
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Threshold Setting */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-destructive" />
              Limite de Alerta
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Você receberá um alerta quando a compatibilidade com um cliente 
                      ficar abaixo deste valor.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Badge variant="outline" className={thresholdLevel.color}>
              {settings.alert_threshold}% - {thresholdLevel.label}
            </Badge>
          </div>

          <Slider
            value={[settings.alert_threshold]}
            onValueChange={([value]) => setSettings({ ...settings, alert_threshold: value })}
            min={20}
            max={80}
            step={5}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>20% (muitos alertas)</span>
            <span>80% (poucos alertas)</span>
          </div>

          <p className="text-xs text-muted-foreground">
            {thresholdLevel.description}
          </p>
        </div>

        <Separator />

        {/* Important Clients Only */}
        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
          <div className="space-y-1">
            <Label className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-info" />
              Apenas Clientes Importantes
            </Label>
            <p className="text-xs text-muted-foreground">
              Alertar apenas para clientes com alto score de relacionamento
            </p>
          </div>
          <Switch
            checked={settings.alert_only_important}
            onCheckedChange={(checked) => setSettings({ ...settings, alert_only_important: checked })}
          />
        </div>

        {/* Important Client Threshold */}
        {settings.alert_only_important && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pl-4 border-l-2 border-primary/20"
          >
            <Label className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Score mínimo de relacionamento
            </Label>
            <Slider
              value={[settings.important_min_relationship_score]}
              onValueChange={([value]) => setSettings({ ...settings, important_min_relationship_score: value })}
              min={30}
              max={90}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">30%</span>
              <Badge variant="secondary">{settings.important_min_relationship_score}%</Badge>
              <span className="text-xs text-muted-foreground">90%</span>
            </div>
          </motion.div>
        )}

        <Separator />

        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
          <div className="space-y-1">
            <Label className="font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-warning" />
              Notificações por Email
            </Label>
            <p className="text-xs text-muted-foreground">
              Receber alertas por email além das notificações no app
            </p>
          </div>
          <Switch
            checked={settings.email_notifications}
            onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
          />
        </div>

        {/* Preview Alert */}
        <div className="p-4 rounded-lg border-2 border-dashed border-warning/30 bg-warning dark:bg-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning dark:text-warning">
                Prévia do Alerta
              </p>
              <p className="text-xs text-warning dark:text-warning mt-1">
                "A compatibilidade com <strong>João Silva</strong> está em <strong>45%</strong>, 
                abaixo do limite de <strong>{settings.alert_threshold}%</strong>. 
                Considere revisar sua estratégia de comunicação."
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações de Alerta'}
        </Button>
      </CardContent>
    </Card>
  );
}
