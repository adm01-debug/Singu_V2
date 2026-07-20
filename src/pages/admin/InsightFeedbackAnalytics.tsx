import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ThumbsUp, ThumbsDown, TrendingDown, AlertTriangle, ExternalLink, RefreshCcw, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { InsightFeedbackTrendChart } from '@/components/admin/InsightFeedbackTrendChart';

type Kind = 'preference' | 'hobby' | 'tone';

interface Row {
  id: string;
  contact_id: string;
  insight_kind: Kind;
  insight_label: string;
  vote: -1 | 1;
  note: string | null;
  created_at: string;
}

const KIND_LABEL: Record<Kind, string> = {
  preference: 'Preferências',
  hobby: 'Hobbies',
  tone: 'Tom de comunicação',
};

function useFeedbackData() {
  return useQuery({
    queryKey: ['admin-insight-feedback'],
    staleTime: 60_000,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from('behavioral_insight_feedback')
        .select('id, contact_id, insight_kind, insight_label, vote, note, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
}

interface LabelAgg {
  label: string;
  kind: Kind;
  up: number;
  down: number;
  total: number;
  contacts: Set<string>;
  lastNote: string | null;
}

function aggregateByLabel(rows: Row[]): LabelAgg[] {
  const map = new Map<string, LabelAgg>();
  for (const r of rows) {
    const key = `${r.insight_kind}::${r.insight_label.toLowerCase()}`;
    let agg = map.get(key);
    if (!agg) {
      agg = { label: r.insight_label, kind: r.insight_kind, up: 0, down: 0, total: 0, contacts: new Set(), lastNote: null };
      map.set(key, agg);
    }
    if (r.vote === 1) agg.up += 1; else agg.down += 1;
    agg.total += 1;
    agg.contacts.add(r.contact_id);
    if (!agg.lastNote && r.note) agg.lastNote = r.note;
  }
  return Array.from(map.values());
}

function StatCard({ title, value, icon: Icon, tone }: { title: string; value: string | number; icon: typeof ThumbsUp; tone?: 'positive' | 'negative' | 'neutral' }) {
  const toneCls =
    tone === 'positive' ? 'text-emerald-600' :
    tone === 'negative' ? 'text-destructive' :
    'text-primary';
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-md bg-muted p-2 ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RankingTable({ items, sort }: { items: LabelAgg[]; sort: 'down' | 'up' }) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sort === 'down') return b.down - a.down || b.total - a.total;
      return b.up - a.up || b.total - a.total;
    }).slice(0, 30);
  }, [items, sort]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Sem dados ainda. Os feedbacks aparecerão aqui conforme os usuários avaliarem insights.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rótulo</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">👍</TableHead>
          <TableHead className="text-right">👎</TableHead>
          <TableHead>Aprovação</TableHead>
          <TableHead className="text-right">Contatos</TableHead>
          <TableHead>Última observação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((a) => {
          const approval = a.total > 0 ? (a.up / a.total) * 100 : 0;
          return (
            <TableRow key={`${a.kind}-${a.label}`}>
              <TableCell className="font-medium">{a.label}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{KIND_LABEL[a.kind]}</Badge></TableCell>
              <TableCell className="text-right tabular-nums text-emerald-600">{a.up}</TableCell>
              <TableCell className="text-right tabular-nums text-destructive">{a.down}</TableCell>
              <TableCell className="w-40">
                <div className="flex items-center gap-2">
                  <Progress value={approval} className="h-1.5" />
                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{approval.toFixed(0)}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{a.contacts.size}</TableCell>
              <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={a.lastNote ?? undefined}>
                {a.lastNote ?? '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ContactsWithMostDownvotes({ rows }: { rows: Row[] }) {
  const { user } = useAuth();
  const [batchRunning, setBatchRunning] = useState(false);

  const agg = useMemo(() => {
    const m = new Map<string, { down: number; up: number }>();
    for (const r of rows) {
      const cur = m.get(r.contact_id) ?? { down: 0, up: 0 };
      if (r.vote === -1) cur.down += 1; else cur.up += 1;
      m.set(r.contact_id, cur);
    }
    return Array.from(m.entries())
      .map(([contact_id, v]) => ({ contact_id, ...v, total: v.up + v.down }))
      .filter((x) => x.down > 0)
      .sort((a, b) => b.down - a.down)
      .slice(0, 15);
  }, [rows]);

  const eligibleForRebatch = useMemo(
    () => agg.filter((c) => c.down >= 3).map((c) => c.contact_id),
    [agg],
  );

  async function runBatch() {
    if (eligibleForRebatch.length === 0) return;
    setBatchRunning(true);
    const userId = user?.id ?? null;
    let ok = 0;
    let fail = 0;
    // Sequencial + delay pequeno para evitar rate-limit da IA
    for (const contactId of eligibleForRebatch) {
      const nowIso = new Date().toISOString();
      await supabase
        .from('behavioral_profile_regen_queue')
        .upsert(
          {
            contact_id: contactId,
            user_id: userId,
            enqueued_at: nowIso,
            next_run_at: nowIso,
            trigger_source: 'admin_manual_batch',
            last_processed_at: nowIso,
          },
          { onConflict: 'contact_id' },
        );
      try {
        const { error } = await supabase.functions.invoke('generate-behavioral-profile', {
          body: { contact_id: contactId, trigger: 'admin_manual_batch' },
        });
        if (error) throw error;
        ok += 1;
        await supabase
          .from('behavioral_profile_regen_queue')
          .update({ last_error: null })
          .eq('contact_id', contactId);
      } catch (e) {
        fail += 1;
        const msg = e instanceof Error ? e.message : String(e);
        logger.error('[runBatch] falha ao reanalisar', contactId, msg);
        await supabase
          .from('behavioral_profile_regen_queue')
          .update({ last_error: msg })
          .eq('contact_id', contactId);
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    setBatchRunning(false);
    if (fail === 0) toast.success(`${ok} perfis reanalisados com sucesso`);
    else toast.warning(`${ok} reanalisados · ${fail} falharam`);
  }

  if (agg.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        Nenhum contato acumulou downvotes ainda.
      </p>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {eligibleForRebatch.length} contato(s) com 3+ reprovações elegíveis para reanálise.
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={batchRunning || eligibleForRebatch.length === 0}
          onClick={runBatch}
          className="gap-1.5"
        >
          {batchRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="h-3.5 w-3.5" />
          )}
          Reanalisar em lote
        </Button>
      </div>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contato</TableHead>
          <TableHead className="text-right">👎</TableHead>
          <TableHead className="text-right">👍</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agg.map((c) => (
          <TableRow key={c.contact_id}>
            <TableCell className="font-mono text-xs">{c.contact_id.slice(0, 8)}…</TableCell>
            <TableCell className="text-right tabular-nums text-destructive">{c.down}</TableCell>
            <TableCell className="text-right tabular-nums text-emerald-600">{c.up}</TableCell>
            <TableCell className="text-right tabular-nums">{c.total}</TableCell>
            <TableCell>
              <Link
                to={`/contatos/${c.contact_id}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Abrir contato <ExternalLink className="h-3 w-3" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>
    </>
  );
}

export default function InsightFeedbackAnalytics() {
  const { data: allRows = [], isLoading, error } = useFeedbackData();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const rows = useMemo(() => {
    if (period === 'all') return allRows;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = Date.now() - days * 86400_000;
    return allRows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
  }, [allRows, period]);

  const stats = useMemo(() => {
    const up = rows.filter((r) => r.vote === 1).length;
    const down = rows.filter((r) => r.vote === -1).length;
    const total = rows.length;
    const approval = total > 0 ? (up / total) * 100 : 0;
    const withNotes = rows.filter((r) => (r.note ?? '').trim().length > 0).length;
    const last30 = rows.filter((r) => new Date(r.created_at) > new Date(Date.now() - 30 * 86400_000)).length;
    return { up, down, total, approval, withNotes, last30 };
  }, [rows]);

  const byLabel = useMemo(() => aggregateByLabel(rows), [rows]);

  function exportCsv() {
    if (rows.length === 0) {
      toast.info('Nada para exportar no período selecionado.');
      return;
    }
    const header = ['created_at', 'contact_id', 'insight_kind', 'insight_label', 'vote', 'note'];
    const escape = (v: string | null) => {
      const s = (v ?? '').replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const lines = [
      header.join(','),
      ...rows.map((r) => [
        r.created_at,
        r.contact_id,
        r.insight_kind,
        escape(r.insight_label),
        r.vote,
        escape(r.note),
      ].join(',')),
    ];
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-insights-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} registros exportados.`);
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Erro ao carregar feedbacks: {(error as Error).message}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Qualidade dos insights comportamentais</h1>
          <p className="text-sm text-muted-foreground">
            Métricas agregadas do feedback (👍/👎). Insights com muita reprovação são suprimidos nas próximas regenerações.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-border" role="group" aria-label="Período">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={
                  'px-3 py-1 text-xs transition-colors ' +
                  (period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent text-muted-foreground hover:bg-muted')
                }
              >
                {p === 'all' ? 'Tudo' : p}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Aprovações" value={stats.up} icon={ThumbsUp} tone="positive" />
        <StatCard title="Reprovações" value={stats.down} icon={ThumbsDown} tone="negative" />
        <StatCard title="Taxa de aprovação" value={`${stats.approval.toFixed(1)}%`} icon={TrendingDown} tone={stats.approval >= 70 ? 'positive' : stats.approval >= 40 ? 'neutral' : 'negative'} />
        <StatCard title="Últimos 30 dias" value={stats.last30} icon={AlertTriangle} tone="neutral" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendência de aprovação (12 semanas)</CardTitle>
          <CardDescription>
            Percentual de votos positivos sobre o total, agrupado por semana.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InsightFeedbackTrendChart rows={rows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranking por rótulo</CardTitle>
          <CardDescription>
            Rótulos mais avaliados. Priorize revisar os mais reprovados — eles alimentam o guard-rail do prompt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="down">
            <TabsList>
              <TabsTrigger value="down">Mais reprovados</TabsTrigger>
              <TabsTrigger value="up">Mais aprovados</TabsTrigger>
            </TabsList>
            <TabsContent value="down" className="mt-3">
              <RankingTable items={byLabel} sort="down" />
            </TabsContent>
            <TabsContent value="up" className="mt-3">
              <RankingTable items={byLabel} sort="up" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatos com mais reprovações</CardTitle>
          <CardDescription>
            Podem indicar histórico ruidoso ou perfis desatualizados. Considere reanalisar manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactsWithMostDownvotes rows={rows} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Última atualização: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · {rows.length} de {allRows.length} registros no período
      </p>
    </div>
  );
}