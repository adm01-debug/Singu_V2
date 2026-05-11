import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, MessageSquare, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function EscalationAutomation({ contactId }: { contactId: string }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [escalationEnabled, setEscalationEnabled] = useState(false);
  const [delay, setDelay] = useState('24');

  const handleSave = () => {
    toast.success('Configurações de automação e escalonamento salvas para este contato');
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-sm">Automação de Follow-up & Escalonamento</CardTitle>
            <CardDescription className="text-xs">Configure como o sistema deve agir se o próximo passo não for concluído</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Bell className="h-3 w-3" /> Lembretes Ativos
            </Label>
            <p className="text-[10px] text-muted-foreground">Notificar via E-mail e WhatsApp interno</p>
          </div>
          <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> Escalonamento Automático
            </Label>
            <p className="text-[10px] text-muted-foreground">Notificar supervisor se o follow-up atrasar</p>
          </div>
          <Switch checked={escalationEnabled} onCheckedChange={setEscalationEnabled} />
        </div>

        {escalationEnabled && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10">
            <div className="space-y-1.5">
              <Label className="text-[10px]">Atraso Máximo (horas)</Label>
              <Input 
                type="number" 
                value={delay} 
                onChange={(e) => setDelay(e.target.value)}
                className="h-8 text-xs" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Escalar para</Label>
              <Select defaultValue="supervisor">
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">Supervisor de Vendas</SelectItem>
                  <SelectItem value="manager">Gerente Regional</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Button onClick={handleSave} className="w-full h-8 text-xs" variant="outline">
          Salvar Configurações de Fluxo
        </Button>
      </CardContent>
    </Card>
  );
}