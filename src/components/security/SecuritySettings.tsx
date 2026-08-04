import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Monitor, Globe, Shield } from 'lucide-react';
import { useAccessSecurity } from '@/hooks/useAccessSecurity';

export function SecuritySettings() {
  const { settings, isLoading, update } = useAccessSecurity();

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />Configurações de Segurança
        </CardTitle>
        <CardDescription className="text-xs">Ajuste o nível de proteção da sua conta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm cursor-pointer">Restrição por IP</Label>
          </div>
          <Switch
            checked={settings.enable_ip_restriction}
            onCheckedChange={v => update({ enable_ip_restriction: v })}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm cursor-pointer">Geo-Blocking</Label>
          </div>
          <Switch
            checked={settings.enable_geo_blocking}
            onCheckedChange={v => update({ enable_geo_blocking: v })}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm cursor-pointer">Detecção de dispositivos</Label>
          </div>
          <Switch
            checked={settings.enable_device_detection}
            onCheckedChange={v => update({ enable_device_detection: v })}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm cursor-pointer">Notificar novo dispositivo</Label>
          </div>
          <Switch
            checked={settings.notify_new_device}
            onCheckedChange={v => update({ notify_new_device: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Máx. sessões</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={settings.max_sessions}
              onChange={e => update({ max_sessions: parseInt(e.target.value, 10) || 5 })}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Timeout (min)</Label>
            <Input
              type="number"
              min={15}
              max={1440}
              value={settings.session_timeout_minutes}
              onChange={e => update({ session_timeout_minutes: parseInt(e.target.value, 10) || 480 })}
              className="h-8"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
