import { Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNotificationPreferences, type Channel, type Urgency, type DigestMode } from '@/hooks/useNotificationPreferences';

const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'in_app', label: 'No app' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push (browser)' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const URGENCIES: { value: Urgency; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

const DIGESTS: { value: DigestMode; label: string; desc: string }[] = [
  { value: 'immediate', label: 'Imediato', desc: 'Cada evento gera notificação' },
  { value: 'hourly', label: 'A cada hora', desc: 'Agrupa em digest horário' },
  { value: 'daily', label: 'Diário', desc: 'Um resumo único por dia' },
];

export default function NotificacoesConfig() {
  const { data, isLoading, save } = useNotificationPreferences();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toggleChannel = (c: Channel) => {
    const set = new Set(data.enabled_channels);
    if (set.has(c)) set.delete(c); else set.add(c);
    if (set.size === 0) set.add('in_app');
    save.mutate({ enabled_channels: Array.from(set) });
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Notificações inteligentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure quando e como receber alertas. A IA usa essas preferências para escolher o canal ideal.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Canais habilitados</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {CHANNELS.map((c) => (
            <label
              key={c.value}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border cursor-pointer hover:bg-accent/40"
            >
              <span className="text-sm">{c.label}</span>
              <Switch
                checked={data.enabled_channels.includes(c.value)}
                onCheckedChange={() => toggleChannel(c.value)}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Horário silencioso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Início</Label>
              <span className="text-sm font-medium">{data.quiet_hours_start.toString().padStart(2,'0')}:00</span>
            </div>
            <Slider
              min={0} max={23} step={1}
              value={[data.quiet_hours_start]}
              onValueChange={(v) => save.mutate({ quiet_hours_start: v[0] })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Fim</Label>
              <span className="text-sm font-medium">{data.quiet_hours_end.toString().padStart(2,'0')}:00</span>
            </div>
            <Slider
              min={0} max={23} step={1}
              value={[data.quiet_hours_end]}
              onValueChange={(v) => save.mutate({ quiet_hours_end: v[0] })}
            />
          </div>
          <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border">
            <div>
              <p className="text-sm">Silêncio nos finais de semana</p>
              <p className="text-xs text-muted-foreground">Suspende não-críticas sábado/domingo</p>
            </div>
            <Switch
              checked={data.weekend_silence}
              onCheckedChange={(v) => save.mutate({ weekend_silence: v })}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Notificações <strong>críticas</strong> ignoram o silêncio. Demais ficam agendadas até o fim da janela.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Limiares por urgência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Email só a partir de</Label>
            <div className="flex gap-1.5">
              {URGENCIES.map((u) => (
                <Button
                  key={u.value}
                  size="sm"
                  variant={data.min_urgency_email === u.value ? 'default' : 'outline'}
                  onClick={() => save.mutate({ min_urgency_email: u.value })}
                  className="flex-1"
                >
                  {u.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Push só a partir de</Label>
            <div className="flex gap-1.5">
              {URGENCIES.map((u) => (
                <Button
                  key={u.value}
                  size="sm"
                  variant={data.min_urgency_push === u.value ? 'default' : 'outline'}
                  onClick={() => save.mutate({ min_urgency_push: u.value })}
                  className="flex-1"
                >
                  {u.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Modo de entrega</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {DIGESTS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => save.mutate({ digest_mode: d.value })}
              className={`px-3 py-3 rounded-md border text-left transition-colors ${
                data.digest_mode === d.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent/40'
              }`}
            >
              <p className="text-sm font-medium">{d.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{d.desc}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
