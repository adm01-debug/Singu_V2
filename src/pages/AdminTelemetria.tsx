import { useState } from "react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, AlertTriangle, Clock, Database, RefreshCw, Zap,
  Trash2, Download, FileText, CalendarIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TelemetryCharts } from "@/components/admin/telemetry/TelemetryCharts";
import { toast } from "sonner";
import { useTelemetryExport, type TelemetryRow } from "@/hooks/useTelemetryExport";


type SeverityFilter = "all" | "slow" | "very_slow" | "error";
type TimeFilter = "1h" | "6h" | "24h" | "7d" | "custom";

export default function AdminTelemetriaPage() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const { exportCSV, exportPDF } = useTelemetryExport();

  const getTimeThreshold = (): { from: string; to: string } => {
    const now = new Date();
    const to = now.toISOString();
    if (timeFilter === "custom" && customDateFrom) {
      const fromDate = new Date(customDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = customDateTo ? new Date(customDateTo) : new Date(customDateFrom);
      toDate.setHours(23, 59, 59, 999);
      return { from: fromDate.toISOString(), to: toDate.toISOString() };
    }
    const offsets: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };
    return { from: new Date(now.getTime() - (offsets[timeFilter] || offsets["24h"])).toISOString(), to };
  };

  const { data: rows = [], isLoading, refetch, isRefetching } = useQuery<TelemetryRow[]>({
    queryKey: ["query-telemetry", severityFilter, timeFilter, customDateFrom?.toISOString(), customDateTo?.toISOString()],
    queryFn: async () => {
      const { from, to } = getTimeThreshold();
      let query = supabase
        .from("query_telemetry")
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(500);

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TelemetryRow[]) || [];
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const handleCleanup = async () => {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("query_telemetry")
      .delete()
      .lt("created_at", threshold);
    if (error) {
      toast.error("Erro ao limpar dados antigos");
    } else {
      toast.success("Dados com mais de 7 dias removidos");
      refetch();
    }
  };

  // Stats
  const verySlow = rows.filter(r => r.severity === "very_slow").length;
  const slow = rows.filter(r => r.severity === "slow").length;
  const errors = rows.filter(r => r.severity === "error").length;
  const avgDuration = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length) : 0;

  const exportMeta = () => ({ timeFilter, verySlow, slow, errors, avgDuration });
  const handleExportCSV = () => exportCSV(rows, exportMeta());
  const handleExportPDF = () => exportPDF(rows, exportMeta());

  // Top offenders
  const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  for (const r of rows) {
    const key = r.rpc_name || r.table_name || "unknown";
    const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
    tableStats.set(key, {
      count: prev.count + 1,
      totalMs: prev.totalMs + r.duration_ms,
      maxMs: Math.max(prev.maxMs, r.duration_ms),
    });
  }
  const topOffenders = [...tableStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const formatDuration = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString("pt-BR", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      day: "2-digit", month: "2-digit",
    });
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "very_slow":
        return <Badge variant="destructive">🔴 Muito Lenta</Badge>;
      case "slow":
        return <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">🟡 Lenta</Badge>;
      case "error":
        return <Badge variant="destructive">❌ Erro</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{severity}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Activity className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Telemetria de Queries</h1>
              <p className="text-sm text-muted-foreground">Monitoramento de performance do banco externo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!rows.length}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!rows.length}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleCleanup}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Limpar +7d
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verySlow}</p>
                <p className="text-[11px] text-muted-foreground">Muito Lentas (&gt;8s)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{slow}</p>
                <p className="text-[11px] text-muted-foreground">Lentas (&gt;3s)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Zap className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{errors}</p>
                <p className="text-[11px] text-muted-foreground">Erros</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDuration(avgDuration)}</p>
                <p className="text-[11px] text-muted-foreground">Média de duração</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Offenders */}
        {topOffenders.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Tabelas Mais Problemáticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {topOffenders.map(([name, stats]) => (
                  <div key={name} className="p-3 rounded-lg border border-border/50 bg-muted/30">
                    <p className="font-mono text-sm font-medium truncate" title={name}>{name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{stats.count}× alertas</span>
                      <span className="text-xs text-destructive">max {formatDuration(stats.maxMs)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      média: {formatDuration(Math.round(stats.totalMs / stats.count))}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <TelemetryCharts rows={rows} timeFilter={timeFilter} />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="slow">🟡 Lentas</SelectItem>
              <SelectItem value="very_slow">🔴 Muito Lentas</SelectItem>
              <SelectItem value="error">❌ Erros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={(v) => {
            setTimeFilter(v as TimeFilter);
            if (v !== "custom") {
              setCustomDateFrom(undefined);
              setCustomDateTo(undefined);
            }
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Última hora</SelectItem>
              <SelectItem value="6h">Últimas 6h</SelectItem>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="custom">📅 Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date pickers */}
          {timeFilter === "custom" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-36 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {customDateFrom ? format(customDateFrom, "dd/MM/yyyy") : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateFrom}
                    onSelect={setCustomDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-36 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {customDateTo ? format(customDateTo, "dd/MM/yyyy") : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateTo}
                    onSelect={setCustomDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <span className="text-xs text-muted-foreground ml-auto">
            {rows.length} registros · auto-refresh 30s
          </span>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma query lenta registrada</p>
                <p className="text-sm mt-1">Isso é bom! O sistema está performando bem.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Quando</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Operação</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Tabela/RPC</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Duração</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Records</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Limit</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Offset</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Count</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Severidade</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                          {formatTime(row.created_at)}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {row.operation}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-xs font-medium">
                          {row.rpc_name || row.table_name || "-"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold tabular-nums">
                          <span className={row.duration_ms >= 8000 ? "text-destructive" : row.duration_ms >= 3000 ? "text-warning" : ""}>
                            {formatDuration(row.duration_ms)}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-xs tabular-nums">
                          {row.record_count ?? "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                          {row.query_limit ?? "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                          {row.query_offset ?? "-"}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {row.count_mode || "-"}
                        </td>
                        <td className="p-3">
                          {getSeverityBadge(row.severity)}
                        </td>
                        <td className="p-3 text-xs text-destructive max-w-[200px] truncate" title={row.error_message || ""}>
                          {row.error_message || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
