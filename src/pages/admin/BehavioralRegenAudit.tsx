import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  Search,
  Download,
  User,
  FileText,
  MessageSquare,
  RotateCw,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { BehavioralRegenAlertBanner } from "@/components/admin/BehavioralRegenAlertBanner";

type QueueRow = {
  contact_id: string;
  user_id: string | null;
  enqueued_at: string | null;
  next_run_at: string | null;
  attempts: number | null;
  last_error: string | null;
  last_processed_at: string | null;
  trigger_source: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PeriodKey = "24h" | "7d" | "30d" | "all";
type StatusFilter = "all" | "success" | "error";

const PAGE_SIZE = 50;

const PERIODS: Array<{ key: PeriodKey; label: string; hours: number | null }> = [
  { key: "24h", label: "24h", hours: 24 },
  { key: "7d", label: "7 dias", hours: 24 * 7 },
  { key: "30d", label: "30 dias", hours: 24 * 30 },
  { key: "all", label: "Tudo", hours: null },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export default function BehavioralRegenAudit() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const periodCutoffIso = useMemo(() => {
    const conf = PERIODS.find((p) => p.key === period);
    if (!conf?.hours) return null;
    return new Date(Date.now() - conf.hours * 3600 * 1000).toISOString();
  }, [period]);

  // ---- Paginação keyset server-side ----
  const {
    data: pages,
    isLoading,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<QueueRow[]>({
    queryKey: ["behavioral-regen-audit", period, statusFilter],
    initialPageParam: null as string | null,
    staleTime: 30_000,
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from("behavioral_profile_regen_queue")
        .select(
          "contact_id, user_id, enqueued_at, next_run_at, attempts, last_error, last_processed_at, trigger_source, created_at, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (periodCutoffIso) q = q.gte("updated_at", periodCutoffIso);
      if (statusFilter === "error") q = q.not("last_error", "is", null);
      if (statusFilter === "success") q = q.is("last_error", null);
      if (pageParam) q = q.lt("updated_at", pageParam);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as QueueRow[];
    },
    getNextPageParam: (last) => {
      if (!last || last.length < PAGE_SIZE) return undefined;
      return last[last.length - 1]?.updated_at ?? undefined;
    },
  });

  // ---- Mutation: reenfileirar manualmente uma reanálise ----
  const requeueMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? "unknown";
      const triggerSource = `manual_retry:${uid.slice(0, 8)}`;
      const nowIso = new Date().toISOString();

      // 1) Marca a fila como retry manual em andamento
      const { error: updErr } = await supabase
        .from("behavioral_profile_regen_queue")
        .update({
          next_run_at: nowIso,
          last_error: null,
          trigger_source: triggerSource,
          updated_at: nowIso,
        })
        .eq("contact_id", contactId);
      if (updErr) throw updErr;

      // 2) Invoca DIRETAMENTE o gerador para este contato (a função de cron
      //    ignora o body e roda o loop completo, então usar a função unitária
      //    é a única forma confiável de reprocessar 1 contato específico).
      const { data: invokeData, error: invokeErr } = await supabase.functions.invoke(
        "generate-behavioral-profile",
        { body: { contact_id: contactId, trigger: triggerSource } },
      );
      const finishedIso = new Date().toISOString();
      const invokePayloadError =
        (invokeData as { error?: string } | null)?.error ?? null;
      if (invokeErr || invokePayloadError) {
        const msg = invokeErr?.message ?? invokePayloadError ?? "erro desconhecido";
        await supabase
          .from("behavioral_profile_regen_queue")
          .update({
            last_error: `manual_retry_failed: ${msg}`,
            last_processed_at: finishedIso,
            updated_at: finishedIso,
          })
          .eq("contact_id", contactId);
        throw new Error(msg);
      }

      // 3) Registra sucesso do retry manual na fila (aparece na auditoria)
      await supabase
        .from("behavioral_profile_regen_queue")
        .update({
          last_error: null,
          last_processed_at: finishedIso,
          updated_at: finishedIso,
        })
        .eq("contact_id", contactId);

      return invokeData;
    },
    onSuccess: (_data, contactId) => {
      toast.success(`Reanálise reenfileirada (${contactId.slice(0, 8)})`);
      queryClient.invalidateQueries({ queryKey: ["behavioral-regen-audit"] });
      queryClient.invalidateQueries({ queryKey: ["behavioral-regen-stats"] });
    },
    onError: (err: Error) => {
      toast.error(`Falha ao reenfileirar: ${err.message}`);
    },
  });

  const data = useMemo(() => (pages?.pages ?? []).flat(), [pages]);

  // ---- Stats agregados server-side (independem da paginação) ----
  const { data: aggStats } = useQuery({
    queryKey: ["behavioral-regen-stats", period, statusFilter],
    staleTime: 30_000,
    queryFn: async () => {
      const buildBase = () => {
        let q = supabase
          .from("behavioral_profile_regen_queue")
          .select("contact_id", { count: "exact", head: true });
        if (periodCutoffIso) q = q.gte("updated_at", periodCutoffIso);
        return q;
      };
      const [totalRes, errorRes] = await Promise.all([
        buildBase(),
        buildBase().not("last_error", "is", null),
      ]);
      if (totalRes.error) throw totalRes.error;
      if (errorRes.error) throw errorRes.error;
      const total = totalRes.count ?? 0;
      const errors = errorRes.count ?? 0;
      const success = Math.max(total - errors, 0);
      const rate = total > 0 ? Math.round((success / total) * 100) : 0;
      return { total, errors, success, rate };
    },
  });

  // ---- Infinite scroll: sentinel próximo ao fim da tabela ----
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const contactIds = useMemo(
    () => Array.from(new Set((data ?? []).map((r) => r.contact_id))).slice(0, 200),
    [data],
  );

  const { data: contactMap } = useQuery({
    queryKey: ["contacts-names-for-regen", contactIds],
    enabled: contactIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .in("id", contactIds);
      if (error) throw error;
      const map = new Map<string, string>();
      for (const c of data ?? []) {
        const full = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
        map.set(c.id as string, full || "—");
      }
      return map;
    },
  });

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r) => {
      const isError = Boolean(r.last_error);
      if (statusFilter === "error" && !isError) return false;
      if (statusFilter === "success" && isError) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const name = contactMap?.get(r.contact_id)?.toLowerCase() ?? "";
        const trigger = (r.trigger_source ?? "").toLowerCase();
        if (!name.includes(s) && !r.contact_id.includes(s) && !trigger.includes(s)) return false;
      }
      return true;
    });
  }, [data, statusFilter, search, contactMap]);

  const stats = useMemo(() => {
    return (
      aggStats ?? { total: 0, errors: 0, success: 0, rate: 0 }
    );
  }, [aggStats]);

  const triggerBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of data ?? []) {
      const key = r.trigger_source ?? "desconhecido";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);

  function exportCsv() {
    try {
      const header = [
        "contact_id",
        "contact_name",
        "trigger_source",
        "attempts",
        "status",
        "last_error",
        "last_processed_at",
        "enqueued_at",
        "updated_at",
      ];
      const lines = [header.join(",")];
      for (const r of filtered) {
        lines.push(
          [
            r.contact_id,
            contactMap?.get(r.contact_id) ?? "",
            r.trigger_source ?? "",
            String(r.attempts ?? 0),
            r.last_error ? "erro" : "sucesso",
            r.last_error ?? "",
            r.last_processed_at ?? "",
            r.enqueued_at ?? "",
            r.updated_at ?? "",
          ]
            .map((v) => csvEscape(String(v)))
            .join(","),
        );
      }
      const blob = new Blob(["\uFEFF" + lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auditoria-reanalise-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exportado");
    } catch (err) {
      toast.error("Falha ao exportar CSV");
      console.error(err);
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BehavioralRegenAlertBanner />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Auditoria de Reanálises</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de reprocessamentos automáticos e manuais de perfis comportamentais.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={period === p.key ? "default" : "outline"}
              aria-pressed={period === p.key}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="ml-1">Atualizar</span>
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total no período" value={stats.total} />
        <StatCard label="Sucessos" value={stats.success} tone="success" />
        <StatCard label="Erros" value={stats.errors} tone={stats.errors > 0 ? "danger" : "neutral"} />
        <StatCard label="Taxa de sucesso" value={`${stats.rate}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Origens dos disparos</CardTitle>
        </CardHeader>
        <CardContent>
          {triggerBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados no período.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {triggerBreakdown.map(([k, v]) => (
                <Badge key={k} variant="secondary">
                  {k} · {v}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">
            Eventos ({filtered.length} carregados
            {stats.total ? ` · ${stats.total} no total` : ""})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contato, ID ou origem"
                className="pl-8 w-64"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "success", "error"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  aria-pressed={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "Todos" : s === "success" ? "Sucesso" : "Erro"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="p-4 text-sm text-destructive">
              Erro ao carregar: {(error as Error).message}
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Nenhum evento encontrado com os filtros atuais.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2">Contato</th>
                    <th className="text-left px-4 py-2">Origem</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Tentativas</th>
                    <th className="text-left px-4 py-2">Processado em</th>
                    <th className="text-left px-4 py-2">Detalhe</th>
                    <th className="text-right px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const isError = Boolean(r.last_error);
                    const name = contactMap?.get(r.contact_id) ?? r.contact_id.slice(0, 8);
                    const iso = r.last_processed_at ?? r.enqueued_at ?? r.updated_at ?? null;
                    // Janela de ±3 dias em torno do evento para filtrar interações relacionadas
                    const eventTime = iso ? new Date(iso) : null;
                    const fromIso = eventTime
                      ? new Date(eventTime.getTime() - 3 * 24 * 3600 * 1000).toISOString().slice(0, 10)
                      : null;
                    const toIso = eventTime
                      ? new Date(eventTime.getTime() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10)
                      : null;
                    const interacoesQuery = new URLSearchParams({
                      contactId: r.contact_id,
                      ...(fromIso ? { from: fromIso } : {}),
                      ...(toIso ? { to: toIso } : {}),
                    }).toString();
                    return (
                      <tr key={r.contact_id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-2">
                          <Link
                            to={`/contatos/${r.contact_id}`}
                            className="text-primary hover:underline"
                          >
                            {name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {r.contact_id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="outline">{r.trigger_source ?? "—"}</Badge>
                        </td>
                        <td className="px-4 py-2">
                          {isError ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" /> Erro
                            </Badge>
                          ) : (
                            <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                              <CheckCircle2 className="h-3 w-3" /> Sucesso
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-2 tabular-nums">{r.attempts ?? 0}</td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {formatDate(r.last_processed_at)}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground max-w-md truncate">
                          {r.last_error ?? `Enfileirado ${formatDate(r.enqueued_at)}`}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    to={`/contatos/${r.contact_id}`}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                                    aria-label="Abrir perfil do contato"
                                  >
                                    <User className="h-3.5 w-3.5" />
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Perfil do contato</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    to={`/contatos/${r.contact_id}/ficha-360`}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                                    aria-label="Abrir ficha 360 do contato"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Ficha 360 (perfil comportamental)</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    to={`/interacoes?${interacoesQuery}`}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                                    aria-label="Ver interações relacionadas ao evento"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Interações (±3 dias em torno do evento)
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => requeueMutation.mutate(r.contact_id)}
                                    disabled={
                                      requeueMutation.isPending &&
                                      requeueMutation.variables === r.contact_id
                                    }
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-50"
                                    aria-label="Reenfileirar reanálise deste contato"
                                  >
                                    <RotateCw
                                      className={`h-3.5 w-3.5 ${
                                        requeueMutation.isPending &&
                                        requeueMutation.variables === r.contact_id
                                          ? "animate-spin"
                                          : ""
                                      }`}
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Reenfileirar reanálise (manual_retry)
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Sentinel + botão manual para carregamento incremental */}
          {!isLoading && !error && filtered.length > 0 && (
            <div className="flex flex-col items-center gap-2 border-t p-3">
              <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />
              {hasNextPage ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
                  ) : null}
                  Carregar mais {PAGE_SIZE}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Fim dos resultados ({data.length} de {stats.total || data.length})
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "danger"
        ? "text-destructive"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}