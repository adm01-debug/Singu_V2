import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Bell, 
  BellOff, 
  Check, 
  RefreshCw, 
  Settings, 
  X,
  Heart,
  Mail,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { useHealthAlerts, HealthAlert } from '@/hooks/useHealthAlerts';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function HealthAlertsPanel() {
  const {
    alerts,
    settings,
    loading,
    settingsLoading,
    dismissAlert,
    dismissAllAlerts,
    saveSettings,
    checkHealthNow
  } = useHealthAlerts();
  
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');
  
  // Local settings state
  const [localSettings, setLocalSettings] = useState({
    push_notifications: settings?.push_notifications ?? true,
    email_notifications: settings?.email_notifications ?? false,
    critical_threshold: settings?.critical_threshold ?? 30,
    warning_threshold: settings?.warning_threshold ?? 50,
    notify_on_critical: settings?.notify_on_critical ?? true,
    notify_on_warning: settings?.notify_on_warning ?? false,
    email_address: settings?.email_address ?? ''
  });

  const handleCheckNow = async () => {
    setChecking(true);
    await checkHealthNow();
    setChecking(false);
  };

  const handleSaveSettings = () => {
    saveSettings(localSettings);
  };

  if (loading || settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-destructive" />
            Alertas de Saúde do Cliente
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckNow}
              disabled={checking}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${checking ? 'animate-spin' : ''}`} />
              Verificar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="alerts" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Alertas ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-3 text-success" />
                <p className="font-medium">Todos os clientes estão saudáveis!</p>
                <p className="text-sm">Nenhum alerta de saúde crítica no momento.</p>
              </div>
            ) : (
              <>
                {alerts.length > 1 && (
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissAllAlerts}
                      className="text-muted-foreground"
                    >
                      <BellOff className="h-4 w-4 mr-1" />
                      Dispensar Todos
                    </Button>
                  </div>
                )}
                
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <AlertCard 
                      key={alert.id} 
                      alert={alert} 
                      onDismiss={dismissAlert}
                      onNavigate={() => navigate(`/contato/${alert.contact_id}`)}
                    />
                  ))}
                </AnimatePresence>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Notification Channels */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Canais de Notificação
              </h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Label>Notificações Push</Label>
                </div>
                <Switch
                  checked={localSettings.push_notifications}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, push_notifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label>Notificações por Email</Label>
                </div>
                <Switch
                  checked={localSettings.email_notifications}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>

              {localSettings.email_notifications && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-6"
                >
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Email para alertas
                  </Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={localSettings.email_address}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ ...prev, email_address: e.target.value }))
                    }
                  />
                </motion.div>
              )}
            </div>

            {/* Alert Thresholds */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Níveis de Alerta
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    Limite Crítico: <span className="text-destructive font-medium">{localSettings.critical_threshold}%</span>
                  </Label>
                  <Switch
                    checked={localSettings.notify_on_critical}
                    onCheckedChange={(checked) => 
                      setLocalSettings(prev => ({ ...prev, notify_on_critical: checked }))
                    }
                  />
                </div>
                <Slider
                  value={[localSettings.critical_threshold]}
                  onValueChange={([value]) => 
                    setLocalSettings(prev => ({ ...prev, critical_threshold: value }))
                  }
                  min={10}
                  max={50}
                  step={5}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  Alertar quando a saúde cair abaixo deste valor
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    Limite de Atenção: <span className="text-warning font-medium">{localSettings.warning_threshold}%</span>
                  </Label>
                  <Switch
                    checked={localSettings.notify_on_warning}
                    onCheckedChange={(checked) => 
                      setLocalSettings(prev => ({ ...prev, notify_on_warning: checked }))
                    }
                  />
                </div>
                <Slider
                  value={[localSettings.warning_threshold]}
                  onValueChange={([value]) => 
                    setLocalSettings(prev => ({ ...prev, warning_threshold: value }))
                  }
                  min={30}
                  max={70}
                  step={5}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  Alertar quando a saúde estiver entre crítico e este valor
                </p>
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface AlertCardProps {
  alert: HealthAlert;
  onDismiss: (id: string) => void;
  onNavigate: () => void;
}

function AlertCard({ alert, onDismiss, onNavigate }: AlertCardProps) {
  const isCritical = alert.alert_type === 'critical';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`
        p-4 rounded-lg border 
        ${isCritical ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`
            p-2 rounded-full 
            ${isCritical ? 'bg-destructive/10' : 'bg-warning/10'}
          `}>
            {isCritical ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <Bell className="h-4 w-4 text-warning" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{alert.title}</h4>
              <Badge variant={isCritical ? 'destructive' : 'secondary'} className="text-xs">
                {alert.health_score}%
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">
              {alert.description}
            </p>
            
            {alert.factors && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-muted-foreground">
                  Último contato: {alert.factors.lastInteractionDays} dias
                </span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(alert.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDismiss(alert.id)}
            aria-label="Dispensar alerta"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon" aria-label="Avançar"
            className="h-7 w-7"
            onClick={onNavigate}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
