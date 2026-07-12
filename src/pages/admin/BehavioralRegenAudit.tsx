import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, RefreshCcw, Search, Download } from "lucide-react";
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
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["behavioral-regen-audit", period],
    queryFn: async () => {
      let q = supabase
        .from("behavioral_profile_regen_queue")
        .select(
          "contact_id, user_id, enqueued_at, next_run_at, attempts, last_error, last_processed_at, trigger_source, created_at, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(500);

      const conf = PERIODS.find((p) => p.key === period);
      if (conf?.hours) {
        const cutoff = new Date(Date.now() - conf.hours * 3600 * 1000).toISOString();
        q = q.gte("updated_at", cutoff);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as QueueRow[];
    },
    staleTime: 30_000,
  });

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
    const rows = data ?? [];
    const total = rows.length;
    const errors = rows.filter((r) => r.last_error).length;
    const success = total - errors;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;
    const totalAttempts = rows.reduce((sum, r) => sum + (r.attempts ?? 0), 0);
    return { total, errors, success, rate, totalAttempts };
  }, [data]);

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
          <CardTitle className="text-base">Eventos ({filtered.length})</CardTitle>
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const isError = Boolean(r.last_error);
                    const name = contactMap?.get(r.contact_id) ?? r.contact_id.slice(0, 8);
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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