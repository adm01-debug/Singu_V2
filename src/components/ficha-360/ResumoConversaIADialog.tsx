import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sparkles,
  Copy,
  Download,
  History,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  MessageCircle,
  User,
  TrendingDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useFicha360ConversationSummary,
  type ConversationSummary,
  type GenerateSummaryParams,
  type SummaryHistoryItem,
} from '@/hooks/useFicha360ConversationSummary';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  interactions: GenerateSummaryParams['interactions'];
  contactSnapshot: GenerateSummaryParams['contact_snapshot'];
  filtersSummary: GenerateSummaryParams['filters_summary'];
}

function summaryToMarkdown(s: ConversationSummary, ctxLabel: string): string {
  const lines: string[] = [];
  lines.push(`# Resumo IA da conversa`);
  lines.push(`_${ctxLabel}_\n`);
  lines.push(`## 👤 Perfil resumido\n${s.perfil_resumido}\n`);
  lines.push(`## 💬 Estilo de comunicação\n${s.estilo_comunicacao}\n`);
  const topicosList = s.topicos_principais.map((t) => `- ${t}`).join('\n');
  lines.push(`## 📌 Tópicos principais\n${topicosList}\n`);
  const decisoesList = s.decisoes_acordos.map((t) => `- ${t}`).join('\n');
  lines.push(`## ✅ Decisões & acordos\n${decisoesList}\n`);
  const pendenciasList = s.pendencias
    .map((p) => {
      const prazo = p.prazo_estimado ? ` _(prazo: ${p.prazo_estimado})_` : '';
      return `- ${p.item}${prazo}`;
    })
    .join('\n');
  lines.push(`## ⏳ Pendências\n${pendenciasList}\n`);
  const sinaisList = s.sinais_relacionamento.map((sig) => `- **${sig.tipo}**: ${sig.descricao}`).join('\n');
  lines.push(`## 🚦 Sinais de relacionamento\n${sinaisList}\n`);
  const proximosList = s.proximos_passos_sugeridos.map((t) => `- ${t}`).join('\n');
  lines.push(`## 🎯 Próximos passos sugeridos\n${proximosList}\n`);
  lines.push(`## 📊 Risco de churn: **${s.risco_churn}** · Confiança: ${s.confianca_analise}%`);
  return lines.join('\n');
}

function buildContextLabel(p: GenerateSummaryParams['filters_summary'], n: number): string {
  const parts: string[] = [`${n} interações`];
  if (p.period_days) parts.push(`Últimos ${p.period_days}d`);
  if (p.channels?.length) parts.push(p.channels.join(' + '));
  if (p.tags?.length) parts.push(`${p.tags.length} tag(s)`);
  if (p.query) parts.push(`busca "${p.query}"`);
  return parts.join(' · ');
}

const signalClass: Record<string, string> = {
  positivo: 'bg-success/10 text-success border-success/30',
  atencao: 'bg-warning/10 text-warning border-warning/30',
  negativo: 'bg-destructive/10 text-destructive border-destructive/30',
};

const churnClass: Record<string, string> = {
  baixo: 'bg-success/10 text-success border-success/30',
  medio: 'bg-warning/10 text-warning border-warning/30',
  alto: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function ResumoConversaIADialog({
  open,
  onOpenChange,
  contactId,
  interactions,
  contactSnapshot,
  filtersSummary,
}: Props) {
  const { generate, generating, history } = useFicha360ConversationSummary(contactId);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState<number>(0);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSummary(null);
      setError(null);
      setAnalyzed(0);
    }
  }, [open]);

  const ctxLabel = useMemo(
    () => buildContextLabel(filtersSummary, interactions.length),
    [filtersSummary, interactions.length],
  );

  const isEmpty = interactions.length === 0;

  const handleGenerate = async (force = false) => {
    setError(null);
    try {
      const res = await generate({
        contact_id: contactId,
        interactions,
        contact_snapshot: contactSnapshot,
        filters_summary: filtersSummary,
        force_refresh: force,
      });
      setSummary(res.summary);
      setAnalyzed(res.interactions_analyzed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    }
  };

  const loadFromHistory = (item: SummaryHistoryItem) => {
    setSummary(item.summary);
    setAnalyzed(item.interactions_analyzed);
    setError(null);
    toast.info('Resumo do histórico carregado.');
  };

  const handleCopy = () => {
    if (!summary) return;
    const md = summaryToMarkdown(summary, ctxLabel);
    navigator.clipboard.writeText(md).then(
      () => toast.success('Markdown copiado!'),
      () => toast.error('Falha ao copiar'),
    );
  };

  const handleDownload = () => {
    if (!summary) return;
    const md = summaryToMarkdown(summary, ctxLabel);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumo-ia-${contactId}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        aria-labelledby="resumo-ia-title"
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <DialogTitle id="resumo-ia-title" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Resumo IA da conversa
              </DialogTitle>
              <DialogDescription className="text-xs">{ctxLabel}</DialogDescription>
            </div>
            {history.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 mr-6">
                    <History className="h-3.5 w-3.5" />
                    Histórico
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  {history.map((h) => (
                    <DropdownMenuItem
                      key={h.id}
                      onSelect={() => loadFromHistory(h)}
                      className="flex flex-col items-start gap-0.5"
                    >
                      <span className="text-xs font-medium">
                        {format(new Date(h.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {h.interactions_analyzed} interações
                        {h.filters_summary?.tags?.length
                          ? ` · ${h.filters_summary.tags.length} tag(s)`
                          : ''}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
            {/* IDLE */}
            {!summary && !generating && !error && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-3">
                {isEmpty ? (
                  <p className="text-muted-foreground">
                    Não há interações para resumir com os filtros atuais. Ajuste os filtros e
                    tente novamente.
                  </p>
                ) : (
                  <>
                    <p>
                      Vou analisar <strong>{interactions.length}</strong> interações filtradas
                      para gerar um resumo do perfil, decisões, pendências e próximos passos.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Esta ação usa IA. Resumos idênticos ficam em cache por 24h.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* LOADING */}
            {generating && (
              <div className="space-y-3" aria-live="polite">
                <p className="text-sm text-muted-foreground">Analisando interações…</p>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {/* ERROR */}
            {error && !generating && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Falha ao gerar resumo</p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleGenerate(true)}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Tentar novamente
                </Button>
              </div>
            )}

            {/* SUCCESS */}
            {summary && !generating && (
              <div className="space-y-4">
                <Section icon={<User className="h-4 w-4" />} title="Perfil resumido">
                  <p className="text-sm">{summary.perfil_resumido}</p>
                </Section>
                <Section icon={<MessageCircle className="h-4 w-4" />} title="Estilo de comunicação">
                  <p className="text-sm">{summary.estilo_comunicacao}</p>
                </Section>
                <Section title="📌 Tópicos principais">
                  <div className="flex flex-wrap gap-1.5">
                    {summary.topicos_principais.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </Section>
                <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Decisões & acordos">
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {summary.decisoes_acordos.map((t, i) => <li key={i}>{t}</li>)}
                    {summary.decisoes_acordos.length === 0 && (
                      <li className="text-muted-foreground list-none -ml-5">Nenhuma decisão registrada.</li>
                    )}
                  </ul>
                </Section>
                <Section icon={<Clock className="h-4 w-4" />} title="Pendências">
                  <ul className="text-sm space-y-1.5">
                    {summary.pendencias.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>
                          {p.item}
                          {p.prazo_estimado && (
                            <span className="text-xs text-muted-foreground ml-1.5">
                              (prazo: {p.prazo_estimado})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                    {summary.pendencias.length === 0 && (
                      <li className="text-muted-foreground">Nenhuma pendência identificada.</li>
                    )}
                  </ul>
                </Section>
                <Section title="🚦 Sinais de relacionamento">
                  <div className="space-y-1.5">
                    {summary.sinais_relacionamento.map((s, i) => (
                      <div
                        key={i}
                        className={cn(
                          'rounded border px-2.5 py-1.5 text-xs flex items-start gap-2',
                          signalClass[s.tipo] ?? 'bg-muted',
                        )}
                        aria-label={`Sinal ${s.tipo}: ${s.descricao}`}
                      >
                        <Badge variant="outline" className="text-[10px] uppercase shrink-0">
                          {s.tipo}
                        </Badge>
                        <span>{s.descricao}</span>
                      </div>
                    ))}
                    {summary.sinais_relacionamento.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sem sinais relevantes.</p>
                    )}
                  </div>
                </Section>
                <Section icon={<Target className="h-4 w-4" />} title="Próximos passos sugeridos">
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {summary.proximos_passos_sugeridos.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </Section>
                <Section icon={<TrendingDown className="h-4 w-4" />} title="Risco de churn & confiança">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn('uppercase', churnClass[summary.risco_churn])}
                    >
                      Risco {summary.risco_churn}
                    </Badge>
                    <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                      <span className="text-xs text-muted-foreground">Confiança</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(100, Math.max(0, summary.confianca_analise))}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium tabular-nums">
                        {summary.confianca_analise}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Baseado em {analyzed} interações analisadas.
                  </p>
                </Section>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2 pt-2 border-t">
          <div className="flex gap-2">
            {summary && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar .md
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-3.5 w-3.5 mr-1.5" /> Fechar
            </Button>
            {!summary && !generating && (
              <Button
                size="sm"
                variant="gradient"
                onClick={() => handleGenerate(false)}
                disabled={isEmpty}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Gerar resumo
              </Button>
            )}
            {summary && !generating && (
              <Button size="sm" variant="outline" onClick={() => handleGenerate(true)}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regerar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}
