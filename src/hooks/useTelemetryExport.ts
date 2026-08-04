import { format } from "date-fns";
import { toast } from "sonner";

interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  record_count: number | null;
  query_limit: number | null;
  query_offset: number | null;
  count_mode: string | null;
  severity: string;
  error_message: string | null;
  user_id: string | null;
  created_at: string;
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function severityLabel(s: string): string {
  const map: Record<string, string> = {
    very_slow: "Muito Lenta",
    slow: "Lenta",
    error: "Erro",
  };
  return map[s] || s;
}

interface ExportMeta {
  timeFilter: string;
  verySlow: number;
  slow: number;
  errors: number;
  avgDuration: number;
}

export function useTelemetryExport() {
  const exportCSV = (rows: TelemetryRow[], meta: ExportMeta) => {
    if (!rows.length) return toast.error("Nenhum dado para exportar");

    const headers = [
      "Data/Hora", "Operação", "Tabela/RPC", "Duração (ms)", "Severidade",
      "Registros", "Limit", "Offset", "Count Mode", "Erro",
    ];
    const csvRows = rows.map(r => [
      new Date(r.created_at).toLocaleString("pt-BR"),
      r.operation,
      r.table_name || r.rpc_name || "-",
      r.duration_ms,
      r.severity,
      r.record_count ?? "-",
      r.query_limit ?? "-",
      r.query_offset ?? "-",
      r.count_mode ?? "-",
      `"${(r.error_message || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(";"), ...csvRows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telemetria_${format(new Date(), "yyyy-MM-dd")}_${meta.timeFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso");
  };

  const exportPDF = async (rows: TelemetryRow[], meta: ExportMeta) => {
    if (!rows.length) return toast.error("Nenhum dado para exportar");

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const now = new Date();

      const periodLabels: Record<string, string> = {
        "1h": "Última hora", "6h": "Últimas 6h", "24h": "Últimas 24h",
        "7d": "Últimos 7 dias", "custom": "Personalizado",
      };

      doc.setFontSize(16);
      doc.text("Telemetria de Queries — Banco Externo", 14, 15);
      doc.setFontSize(9);
      doc.text(
        `Exportado em ${now.toLocaleString("pt-BR")} · Período: ${periodLabels[meta.timeFilter] || meta.timeFilter} · ${rows.length} registros`,
        14, 22
      );
      doc.setFontSize(8);
      doc.text(
        `Muito Lentas: ${meta.verySlow} | Lentas: ${meta.slow} | Erros: ${meta.errors} | Média: ${formatDuration(meta.avgDuration)}`,
        14, 27
      );

      const head = [["Data/Hora", "Operação", "Tabela/RPC", "Duração", "Severidade", "Records", "Limit", "Offset", "Count", "Erro"]];
      const body = rows.map(r => [
        new Date(r.created_at).toLocaleString("pt-BR"),
        r.operation,
        r.table_name || r.rpc_name || "-",
        formatDuration(r.duration_ms),
        severityLabel(r.severity),
        r.record_count?.toString() ?? "-",
        r.query_limit?.toString() ?? "-",
        r.query_offset?.toString() ?? "-",
        r.count_mode || "-",
        (r.error_message || "").substring(0, 60),
      ]);

      autoTable(doc, {
        head, body,
        startY: 31,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`telemetria_${format(now, "yyyy-MM-dd")}_${meta.timeFilter}.pdf`);
      toast.success("PDF exportado com sucesso");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  };

  return { exportCSV, exportPDF };
}

export type { TelemetryRow };
