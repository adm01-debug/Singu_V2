import { memo, useMemo, useState } from 'react';
import { Copy, ChevronDown, MessageCircle, Mail, Phone, FlaskConical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  generateScripts,
  type ScriptChannel,
  type ScriptContext,
  type GeneratedScript,
} from '@/lib/scriptGenerator';
import { useSimulationStore } from '@/stores/useSimulationStore';

interface Props {
  passoId: string;
  firstName: string;
  sentiment: ScriptContext['sentiment'];
  bestTime?: string | null;
  daysSinceLast?: number | null;
  cadenceDays?: number | null;
  fallbackScript?: string;
}

const channelMeta: Record<ScriptChannel, { label: string; icon: typeof Mail }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'E-mail', icon: Mail },
  call: { label: 'Ligação', icon: Phone },
};

function CopyScriptMenuComponent({
  passoId,
  firstName,
  sentiment,
  bestTime,
  daysSinceLast,
  cadenceDays,
  fallbackScript,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ScriptChannel>('whatsapp');

  const simEnabled = useSimulationStore((s) => s.enabled);
  const simOverrides = useSimulationStore((s) => s.overrides);

  // Validação do Modo de Testes: garante que sentimento e melhor horário/canal
  // existam antes de gerar os scripts. Lista o que está faltando para mostrar aviso.
  const missingSimFields = useMemo<string[]>(() => {
    if (!simEnabled) return [];
    const missing: string[] = [];
    if (!simOverrides.sentiment && !sentiment) missing.push('sentimento');
    if (!simOverrides.best_channel) missing.push('canal preferido');
    if (!simOverrides.best_time && !bestTime) missing.push('melhor horário');
    return missing;
  }, [simEnabled, simOverrides, sentiment, bestTime]);

  const hasSimWarning = missingSimFields.length > 0;

  const scripts = useMemo<GeneratedScript[]>(() => {
    const list = generateScripts({
      passoId,
      firstName,
      sentiment,
      bestTime,
      daysSinceLast,
      cadenceDays,
    });
    if (list.length === 0 && fallbackScript) {
      return [{ channel: 'whatsapp', body: fallbackScript, toneLabel: 'Cordial' }];
    }
    return list;
  }, [passoId, firstName, sentiment, bestTime, daysSinceLast, cadenceDays, fallbackScript]);

  const byChannel = useMemo(() => {
    const map: Partial<Record<ScriptChannel, GeneratedScript>> = {};
    for (const s of scripts) map[s.channel] = s;
    return map;
  }, [scripts]);

  const copy = async (text: string, label: string, options?: { description?: string }) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label, options);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="xs" variant="ghost" className="relative">
          <Copy className="h-3 w-3" />
          Copiar script
          {hasSimWarning && (
            <span
              className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-warning"
              aria-label="Modo de testes com dados incompletos"
              title="Modo de testes: faltam dados para gerar o script"
            />
          )}
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-3" align="start">
        {hasSimWarning && (
          <div
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-2 text-[11px] text-warning-foreground"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-warning" aria-hidden="true" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 font-medium text-warning">
                <FlaskConical className="h-3 w-3" aria-hidden="true" />
                Modo de testes — dados incompletos
              </div>
              <p className="text-muted-foreground leading-snug">
                Os scripts foram gerados sem{' '}
                <span className="font-medium text-foreground">{missingSimFields.join(', ')}</span>.
                Defina esses campos no painel "Modo de testes" para um cenário mais realista.
              </p>
            </div>
          </div>
        )}
        <Tabs value={tab} onValueChange={(v) => setTab(v as ScriptChannel)}>
          <TabsList className="grid w-full grid-cols-3 min-h-9 p-1">
            {(Object.keys(channelMeta) as ScriptChannel[]).map((c) => {
              const Icon = channelMeta[c].icon;
              return (
                <TabsTrigger key={c} value={c} className="text-xs min-h-7 px-2">
                  <Icon className="h-3 w-3 mr-1" />
                  {channelMeta[c].label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(channelMeta) as ScriptChannel[]).map((c) => {
            const s = byChannel[c];
            const Icon = channelMeta[c].icon;
            return (
              <TabsContent key={c} value={c} className="space-y-2 mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    <Icon className="h-2.5 w-2.5 mr-1" />
                    {channelMeta[c].label}
                  </Badge>
                  {s && (
                    <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/30 text-primary">
                      Tom: {s.toneLabel}
                    </Badge>
                  )}
                </div>

                {!s ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Sem script disponível para este canal.
                  </p>
                ) : (
                  <>
                    {c === 'email' && s.subject && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-muted-foreground">Assunto</label>
                          <span className="text-[10px] text-muted-foreground">{s.subject.length} caracteres</span>
                        </div>
                        <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-medium">
                          {s.subject}
                        </div>
                        <Button
                          size="xs"
                          variant="outline"
                          className="w-full"
                          onClick={() => copy(s.subject!, 'Assunto copiado')}
                        >
                          <Copy className="h-3 w-3" />
                          Copiar só o assunto
                        </Button>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          {c === 'call' ? 'Roteiro' : c === 'email' ? 'Corpo do e-mail' : 'Mensagem'}
                        </label>
                        <span className="text-[10px] text-muted-foreground">{s.body.length} caracteres</span>
                      </div>
                      <Textarea
                        readOnly
                        value={s.body}
                        className="text-xs font-mono resize-none min-h-[140px]"
                        rows={c === 'email' ? 8 : 6}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="xs"
                        onClick={() => {
                          const text =
                            c === 'email' && s.subject ? `Assunto: ${s.subject}\n\n${s.body}` : s.body;
                          copy(text, `Script de ${channelMeta[c].label} copiado`, {
                            description:
                              c === 'email' && s.subject ? 'Assunto + corpo prontos na área de transferência' : undefined,
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                        Copiar
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export const CopyScriptMenu = memo(CopyScriptMenuComponent);
