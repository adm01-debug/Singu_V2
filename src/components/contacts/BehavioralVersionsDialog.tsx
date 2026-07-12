import { useMemo, useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, ArrowRight, Plus, Minus, Bot, Hand } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useBehavioralProfileVersions,
  diffInsightLists,
  diffStringLists,
  type BehavioralProfileVersion,
} from '@/hooks/useBehavioralProfileVersions';

interface Props {
  contactId: string;
  trigger?: React.ReactNode;
}

function VersionRow({
  version,
  index,
  compareA,
  compareB,
  onPickA,
  onPickB,
}: {
  version: BehavioralProfileVersion;
  index: number;
  compareA: string | null;
  compareB: string | null;
  onPickA: (id: string) => void;
  onPickB: (id: string) => void;
}) {
  const isA = compareA === version.id;
  const isB = compareB === version.id;
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-card p-3 transition-colors',
        (isA || isB) && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Versão {index + 1}</p>
            {version.trigger_source === 'auto' ? (
              <Badge variant="secondary" className="gap-1 text-[10px]"><Bot className="h-3 w-3" /> Auto</Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[10px]"><Hand className="h-3 w-3" /> Manual</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(version.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {' · '}{formatDistanceToNow(new Date(version.generated_at), { addSuffix: true, locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">
            {version.based_on_count} interações{version.model ? ` · ${version.model}` : ''}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" variant={isA ? 'default' : 'outline'} className="h-6 px-2 text-[11px]" onClick={() => onPickA(version.id)}>
            {isA ? '✓ Antes' : 'Antes'}
          </Button>
          <Button size="sm" variant={isB ? 'default' : 'outline'} className="h-6 px-2 text-[11px]" onClick={() => onPickB(version.id)}>
            {isB ? '✓ Depois' : 'Depois'}
          </Button>
        </div>
      </div>
      {version.summary && (
        <p className="mt-2 line-clamp-2 text-xs text-foreground/80">{version.summary}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {version.tone && <Badge variant="secondary" className="text-[10px]">Tom: {version.tone}</Badge>}
        {version.communication_style && <Badge variant="secondary" className="text-[10px]">{version.communication_style}</Badge>}
      </div>
    </div>
  );
}

function DiffSection({
  title,
  added,
  removed,
}: {
  title: string;
  added: string[];
  removed: string[];
}) {
  if (added.length === 0 && removed.length === 0) return null;
  return (
    <section className="space-y-1.5">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {added.map((a, i) => (
          <Badge key={`a-${i}`} className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
            <Plus className="h-3 w-3" /> {a}
          </Badge>
        ))}
        {removed.map((r, i) => (
          <Badge key={`r-${i}`} variant="outline" className="gap-1 text-muted-foreground line-through">
            <Minus className="h-3 w-3" /> {r}
          </Badge>
        ))}
      </div>
    </section>
  );
}

function ScalarDiff({ label, prev, curr }: { label: string; prev: string | null; curr: string | null }) {
  if ((prev ?? '') === (curr ?? '')) return null;
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2 text-xs">
      <p className="font-medium">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-muted-foreground line-through">{prev ?? '—'}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">{curr ?? '—'}</span>
      </div>
    </div>
  );
}

export function BehavioralVersionsDialog({ contactId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const { data: versions = [], isLoading } = useBehavioralProfileVersions(open ? contactId : null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  // Sugere comparação padrão: penúltima (antes) x última (depois)
  useEffect(() => {
    if (versions.length >= 2 && !compareA && !compareB) {
      setCompareA(versions[1].id);
      setCompareB(versions[0].id);
    }
  }, [versions, compareA, compareB]);

  const vA = useMemo(() => versions.find((v) => v.id === compareA) ?? null, [versions, compareA]);
  const vB = useMemo(() => versions.find((v) => v.id === compareB) ?? null, [versions, compareB]);

  const prefDiff = vA && vB ? diffInsightLists(vA.preferences, vB.preferences) : null;
  const hobbyDiff = vA && vB ? diffInsightLists(vA.hobbies, vB.hobbies) : null;
  const topicDiff = vA && vB ? diffStringLists(vA.recurrent_topics, vB.recurrent_topics) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <History className="mr-1.5 h-3.5 w-3.5" /> Histórico
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Histórico do perfil comportamental
          </DialogTitle>
          <DialogDescription>
            Escolha duas versões (Antes / Depois) para comparar mudanças em preferências, hobbies, tópicos e tom.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[300px_1fr]">
          <ScrollArea className="h-[520px] pr-2">
            <div className="space-y-2">
              {isLoading && <p className="text-sm text-muted-foreground">Carregando versões...</p>}
              {!isLoading && versions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ainda não há versões salvas. Gere ou aguarde uma reanálise para começar o histórico.
                </p>
              )}
              {versions.map((v, i) => (
                <VersionRow
                  key={v.id}
                  version={v}
                  index={versions.length - 1 - i}
                  compareA={compareA}
                  compareB={compareB}
                  onPickA={setCompareA}
                  onPickB={setCompareB}
                />
              ))}
            </div>
          </ScrollArea>

          <ScrollArea className="h-[520px]">
            {!vA || !vB ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                Selecione uma versão em <span className="mx-1 font-medium">Antes</span> e outra em{' '}
                <span className="mx-1 font-medium">Depois</span> para ver o comparativo.
              </div>
            ) : vA.id === vB.id ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                As duas seleções são a mesma versão — escolha versões diferentes para comparar.
              </div>
            ) : (
              <div className="space-y-3 pr-2">
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      <b>Antes:</b> {format(new Date(vA.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                    <span>
                      <b>Depois:</b> {format(new Date(vB.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <ScalarDiff label="Tom" prev={vA.tone} curr={vB.tone} />
                <ScalarDiff label="Estilo de comunicação" prev={vA.communication_style} curr={vB.communication_style} />
                <ScalarDiff label="Tendência de sentimento" prev={vA.sentiment_trend} curr={vB.sentiment_trend} />
                <ScalarDiff label="Resumo" prev={vA.summary} curr={vB.summary} />

                <Separator />

                <DiffSection
                  title="Preferências"
                  added={(prefDiff?.added ?? []).map((p) => p.label)}
                  removed={(prefDiff?.removed ?? []).map((p) => p.label)}
                />
                <DiffSection
                  title="Hobbies e interesses"
                  added={(hobbyDiff?.added ?? []).map((h) => h.label)}
                  removed={(hobbyDiff?.removed ?? []).map((h) => h.label)}
                />
                <DiffSection
                  title="Tópicos recorrentes"
                  added={topicDiff?.added ?? []}
                  removed={topicDiff?.removed ?? []}
                />

                {prefDiff?.added.length === 0 && prefDiff?.removed.length === 0 &&
                 hobbyDiff?.added.length === 0 && hobbyDiff?.removed.length === 0 &&
                 topicDiff?.added.length === 0 && topicDiff?.removed.length === 0 &&
                 (vA.tone ?? '') === (vB.tone ?? '') &&
                 (vA.communication_style ?? '') === (vB.communication_style ?? '') &&
                 (vA.sentiment_trend ?? '') === (vB.sentiment_trend ?? '') &&
                 (vA.summary ?? '') === (vB.summary ?? '') && (
                  <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Nenhuma diferença detectada entre estas duas versões.
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}