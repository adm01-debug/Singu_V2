import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function EscalationAutomation({ contactId }: { contactId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [escalationEnabled, setEscalationEnabled] = useState(false);
  const [delay, setDelay] = useState('24');
  const [escalationRole, setEscalationRole] = useState('supervisor');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['contact-automation-settings', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_automation_settings')
        .select('*')
        .eq('contact_id', contactId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contactId
  });

  useEffect(() => {
    if (settings) {
      setNotificationsEnabled(settings.reminder_enabled ?? true);
      setEscalationEnabled(settings.escalation_enabled ?? false);
      setDelay(String(settings.delay_hours ?? 24));
      setEscalationRole(settings.escalation_role ?? 'supervisor');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const payload = {
        contact_id: contactId,
        user_id: user.id,
        reminder_enabled: notificationsEnabled,
        escalation_enabled: escalationEnabled,
        delay_hours: parseInt(delay),
        escalation_role: escalationRole,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('contact_automation_settings')
        .upsert(payload, { onConflict: 'contact_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-automation-settings', contactId] });
      toast.success('Configurações de automação e escalonamento salvas');
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações: ' + error.message);
    }
  });

  if (isLoading) return <div className="h-48 animate-pulse bg-muted/40 rounded-lg" />;

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
              <Select value={escalationRole} onValueChange={setEscalationRole}>
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

        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
          className="w-full h-8 text-xs" 
          variant="outline"
        >
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações de Fluxo'}
        </Button>
      </CardContent>
    </Card>
  );
}