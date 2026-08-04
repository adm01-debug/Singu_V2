import { Helmet } from 'react-helmet-async';
import { RefreshCw, CheckCircle2, XCircle, Mic, Cpu, Volume2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVoiceAIHealth, useRefreshVoiceHealth } from '@/hooks/useVoiceAIHealth';
import { VoiceAITestPanel } from '@/components/admin/VoiceAITestPanel';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SERVICE_META: Record<string, { label: string; icon: typeof Mic }> = {
  elevenlabs_stt: { label: 'ElevenLabs STT (Scribe)', icon: Mic },
  elevenlabs_tts: { label: 'ElevenLabs TTS', icon: Volume2 },
  gemini_nlu: { label: 'Gemini NLU (Lovable AI)', icon: Cpu },
};

function ServiceCard({ service, status, latency_ms, error }: {
  service: string;
  status: 'ok' | 'error';
  latency_ms: number;
  error?: string;
}) {
  const meta = SERVICE_META[service] || { label: service, icon: Cpu };
  const Icon = meta.icon;
  const isOk = status === 'ok';

  return (
    <Card variant={isOk ? 'success' : 'destructive'}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="font-medium text-sm">{meta.label}</span>
          </div>
          {isOk ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {latency_ms}ms
          </span>
          <span className={isOk ? 'text-success' : 'text-destructive'}>
            {isOk ? 'Conectado' : 'Erro'}
          </span>
        </div>

        {error && (
          <p className="text-xs text-destructive mt-2 bg-destructive/5 p-1.5 rounded break-all">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminVoiceDiagnostics() {
  const { data, isLoading } = useVoiceAIHealth();
  const refresh = useRefreshVoiceHealth();

  const services = data?.services ?? [];
  const overallOk = data?.status === 'healthy';

  const checkedLabel = data?.checked_at
    ? format(new Date(data.checked_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
    : '—';

  return (
    <>
      <Helmet>
        <title>Diagnóstico Voice AI | Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Diagnóstico Voice AI</h1>
            <p className="text-muted-foreground text-sm">
              ElevenLabs (STT + TTS) e Gemini NLU (Lovable AI)
            </p>
          </div>
          <Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            <RefreshCw className={cn('h-4 w-4 mr-2', refresh.isPending && 'animate-spin')} />
            Verificar Agora
          </Button>
        </div>

        {/* Overall status */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {overallOk ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive" />
              )}
              <div>
                <p className="font-semibold">{overallOk ? 'Todos os serviços operacionais' : 'Serviço(s) com problema'}</p>
                <p className="text-xs text-muted-foreground">
                  Latência total: {data?.total_latency_ms ?? 0}ms • Verificado: {checkedLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-4"><div className="h-16 animate-pulse rounded bg-muted/40" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.service} {...s} />
            ))}
          </div>
        )}

        {/* Test Panel */}
        <VoiceAITestPanel />

        {/* Intent reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intenções Suportadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-5">
              {[
                { intent: 'search', desc: 'Buscar contatos/empresas' },
                { intent: 'navigate', desc: 'Navegar para página' },
                { intent: 'answer', desc: 'Responder pergunta' },
                { intent: 'create_interaction', desc: 'Criar interação' },
                { intent: 'create_reminder', desc: 'Criar lembrete' },
              ].map((item) => (
                <div key={item.intent} className="bg-muted/20 p-3 rounded text-center">
                  <p className="font-mono text-xs text-primary">{item.intent}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
