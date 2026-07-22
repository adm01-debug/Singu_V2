import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import { Link, useSearchParams } from "react-router-dom";
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
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { BehavioralRegenAlertBanner } from "@/components/admin/BehavioralRegenAlertBanner";
import { BehavioralRegenCronHealth } from "@/components/admin/BehavioralRegenCronHealth";
import { BehavioralRegenAlertsStats } from "@/components/admin/BehavioralRegenAlertsStats";
import { BehavioralRegenAlertsTrend } from "@/components/admin/BehavioralRegenAlertsTrend";
import { useUiPreferencesSync } from "@/hooks/useUiPreferencesSync";
import { parseApiError } from '@/lib/errorMessages';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const hasUrlOverride = searchParams.has("hide_sim");
  const hideSimulations = searchParams.get("hide_sim") === "1";
  const toggleHideSimulations = () => {
    const next = new URLSearchParams(searchParams);
    // Sempre grava explicitamente para que a preferência seja persistida
    // cross-device via user_ui_preferences (URL > backend > default).
    next.set("hide_sim", hideSimulations ? "0" : "1");
    setSearchParams(next, { replace: true });
  };

  // Sincronia cross-device: hidrata do backend se a URL não trouxer override.
  useUiPreferencesSync<{ hide_sim: boolean }>({
    scope: "behavioral_regen_audit",
    current: { hide_sim: hideSimulations },
    defaults: { hide_sim: false },
    sanitize: (raw) => {
      const obj = (raw ?? {}) as Record<string, unknown>;
      return { hide_sim: obj.hide_sim === true };
    },
    hydrate: (prefs) => {
      const next = new URLSearchParams(searchParams);
      next.set("hide_sim", prefs.hide_sim ? "1" : "0");
      setSearchParams(next, { replace: true });
    },
    hasUrlOverride,
  });
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
    refetchOnWindowFocus: false,
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
      // Usa proxy service-role — admin não precisa de RLS sobre o histórico do contato.
      // A função valida a role 'admin', invoca o gerador com bypass RLS, incrementa
      // attempts em falha e registra last_processed_at corretamente.
      const { data, error } = await supabase.functions.invoke("retry-behavioral-profile", {
        body: { contact_id: contactId },
      });
      const payload = (data ?? null) as
        | { error?: string; cooldown?: boolean; retry_in_seconds?: number }
        | null;
      if (payload?.cooldown) {
        // cooldown não é erro real — sinaliza para o onError tratar como aviso.
        const err = new Error(payload.error ?? "Em cooldown");
        (err as Error & { cooldown?: boolean }).cooldown = true;
        throw err;
      }
      if (error || payload?.error) {
        throw new Error(error?.message ?? payload?.error ?? "erro desconhecido");
      }
      return data;
    },
    onSuccess: (_data, contactId) => {
      toast.success(`Reanálise reenfileirada (${contactId.slice(0, 8)})`);
      queryClient.invalidateQueries({ queryKey: ["behavioral-regen-audit"] });
      queryClient.invalidateQueries({ queryKey: ["behavioral-regen-stats"] });
    },
    onError: (err: Error & { cooldown?: boolean }) => {
      if (err.cooldown) {
        toast.warning(err.message);
      } else {
        toast.error(`Falha ao reenfileirar: ${parseApiError(err)}`);
      }
    },
  });

  // ---- Mutation: housekeeping (limpa antigos + dead-letter) ----
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("cleanup_behavioral_regen_queue", {
        _retention_days: 30,
        _max_attempts: 5,
        _dead_letter_backoff_days: 7,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as {
        deleted_success: number;
        parked_dead_letter: number;
      } | null;
    },
    onSuccess: (row) => {
      const del = row?.deleted_success ?? 0;
      const park = row?.parked_dead_letter ?? 0;
      toast.success(
        `Fila limpa · ${del} sucessos antigos removidos · ${park} dead-letter adiados`,
      );
      queryClient.invalidateQueries({ queryKey: ["behavioral-regen-audit"] });
      queryClient.invalidateQueries({ queryKey: ["behavioral-regen-stats"] });
    },
    onError: (err: Error) => {
      toast.error(`Falha na limpeza: ${parseApiError(err)}`);
    },
  });

  // ---- Mutation: batch retry (todos os erros carregados) ----
  // Executa sequencialmente com 600ms entre chamadas para não estourar rate limit.
  // Se o backend responder cooldown (429), contabiliza como "pulado" e segue.
  const [batchProgress, setBatchProgress] = useState<{
    running: boolean;
    done: number;
    total: number;
    ok: number;
    failed: number;
    skipped: number;
  } | null>(null);

  const batchRetryMutation = useMutation({
    mutationFn: async (contactIds: string[]) => {
      let ok = 0;
      let failed = 0;
      let skipped = 0;
      setBatchProgress({
        running: true,
        done: 0,
        total: contactIds.length,
        ok: 0,
        failed: 0,
        skipped: 0,
      });
      for (let i = 0; i < contactIds.length; i++) {
        const id = contactIds[i];
        try {
          const { data, error } = await supabase.functions.invoke(
            "retry-behavioral-profile",
            { body: { contact_id: id } },
          );
          const payload = (data ?? null) as
            | { error?: string; cooldown?: boolean }
            | null;
          if (payload?.cooldown) {
            skipped++;
          } else if (error || payload?.error) {
            failed++;
          } else {
            ok++;
          }
        } catch {
          failed++;
        }
        setBatchProgress({
          running: true,
          done: i + 1,
          total: contactIds.length,
          ok,
          failed,
          skipped,
        });
        // Pausa entre chamadas para respirar (rate limit + LLM cost).
        if (i < contactIds.length - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
      return { ok, failed, skipped, total: contactIds.length };
    },
    onSuccess: (res) => {
      setBatchProgress((p) => (p ? { ...p, running: false } : null));
      toast.success(
        `Batch retry concluído · ${res.ok} OK · ${res.failed} falhas · ${res.skipped} em cooldown`,
      );
      queryClient.invalidateQueries({ queryKey: ["behavioral-regen-audit"] });
      queryClient.invalidateQueries({ queryKey: ["behavioral-regen-stats"] });
    },
    onError: (err: Error) => {
      setBatchProgress((p) => (p ? { ...p, running: false } : null));
      toast.error(`Batch retry abortado: ${parseApiError(err)}`);
    },
  });

  const data = useMemo(() => (pages?.pages ?? []).flat(), [pages]);

  // ---- Stats agregados server-side (independem da paginação) ----
  const { data: aggStats } = useQuery({
    queryKey: ["behavioral-regen-stats", period, statusFilter],
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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
        .in("id", contactIds)
        .limit(500);
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
      logger.error('CSV export failed:', err);
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BehavioralRegenAlertBanner />
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          variant={hideSimulations ? "default" : "outline"}
          onClick={toggleHideSimulations}
          aria-pressed={hideSimulations}
          title={
            hideSimulations
              ? "Mostrando apenas alertas reais"
              : "Incluindo simulações nas métricas"
          }
        >
          {hideSimulations ? (
            <EyeOff className="h-4 w-4 mr-1" />
          ) : (
            <Eye className="h-4 w-4 mr-1" />
          )}
          {hideSimulations ? "Ocultando simulações" : "Ocultar simulações"}
        </Button>
      </div>
      <BehavioralRegenAlertsStats hideSimulations={hideSimulations} />
      <BehavioralRegenAlertsTrend hideSimulations={hideSimulations} />
      <BehavioralRegenCronHealth />
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (
                window.confirm(
                  "Limpar a fila?\n\n• Remove itens processados com sucesso há mais de 30 dias\n• Adia por 7 dias itens que falharam 5+ vezes (dead-letter)",
                )
              ) {
                cleanupMutation.mutate();
              }
            }}
            disabled={cleanupMutation.isPending}
            title="Housekeeping: retenção 30d + dead-letter"
          >
            {cleanupMutation.isPending ? (
              <RotateCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Limpar fila
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const errorIds = filtered
                .filter((r) => Boolean(r.last_error))
                .map((r) => r.contact_id);
              if (errorIds.length === 0) {
                toast.info("Nenhum item com erro no filtro atual");
                return;
              }
              if (
                window.confirm(
                  `Reprocessar ${errorIds.length} contato(s) com erro?\n\nExecuta em série (~600ms entre cada).\nItens em cooldown serão pulados.`,
                )
              ) {
                batchRetryMutation.mutate(errorIds);
              }
            }}
            disabled={batchRetryMutation.isPending || batchProgress?.running}
            title="Reprocessa todos os itens com erro visíveis"
          >
            {batchRetryMutation.isPending ? (
              <RotateCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4 mr-1" />
            )}
            Retry todos c/ erro
          </Button>
        </div>
      </header>

      {batchProgress && (
        <div
          className="rounded-md border bg-muted/40 px-3 py-2 text-sm flex items-center justify-between gap-4"
          role="status"
          aria-live="polite"
        >
          <span>
            {batchProgress.running ? "Reprocessando" : "Concluído"} ·{" "}
            <strong>{batchProgress.done}</strong>/{batchProgress.total} · ✅{" "}
            {batchProgress.ok} · ❌ {batchProgress.failed} · ⏸ {batchProgress.skipped}
          </span>
          {!batchProgress.running && (
            <Button size="sm" variant="ghost" onClick={() => setBatchProgress(null)}>
              Fechar
            </Button>
          )}
        </div>
      )}

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