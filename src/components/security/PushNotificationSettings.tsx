import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';
import { useAccessSecurity } from '@/hooks/useAccessSecurity';

export function PushNotificationSettings() {
  const { settings, update } = useAccessSecurity();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />Notificações de Segurança
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Notificar login em novo dispositivo</Label>
          </div>
          <Switch
            checked={settings.notify_new_device}
            onCheckedChange={v => update({ notify_new_device: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
