import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Play, Save, Download, FolderOpen, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useSavedReports } from '@/hooks/useSavedReports';
import { ReportConfigPanel } from '@/components/reports/ReportConfigPanel';
import { ReportResultView } from '@/components/reports/ReportResultView';
import {
  ENTITIES, runReport, exportToCsv, downloadCsv,
  type EntityKey, type ReportFilter, type ReportAggregation, type ReportResult, type ReportConfig,
} from '@/lib/reports/reportEngine';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function CustomReports() {
  const { user } = useAuth();
  const { reports, saveReport, deleteReport } = useSavedReports();

  const [name, setName] = useState('Novo relatório');
  const [entity, setEntity] = useState<EntityKey>('contacts');
  const [selectedFields, setSelectedFields] = useState<string[]>(['first_name', 'last_name', 'email', 'company.name', 'created_at']);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [aggregations, setAggregations] = useState<ReportAggregation[]>([{ fn: 'count', fieldKey: ENTITIES.contacts.fields[0].key }]);

  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const buildConfig = useCallback((): ReportConfig => ({
    name,
    entity,
    fields: selectedFields,
    filters,
    groupBy,
    aggregations,
    limit: 1000,
  }), [name, entity, selectedFields, filters, groupBy, aggregations]);

  const execute = async () => {
    if (!user?.id) return;
    if (selectedFields.length === 0) {
      toast.error('Selecione ao menos uma coluna');
      return;
    }
    setLoading(true);
    try {
      const config = buildConfig();
      const r = await runReport(config, user.id);
      setResult(r);
      toast.success(`${r.rows.length} registros encontrados`);
    } catch (e) {
      logger.error('Report execution failed', e);
      toast.error('Falha ao executar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Defina um nome para o relatório');
      return;
    }
    saveReport(buildConfig());
  };

  const handleExport = () => {
    if (!result) {
      toast.error('Execute o relatório primeiro');
      return;
    }
    const csv = exportToCsv(result, buildConfig());
    downloadCsv(`${name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`, csv);
    toast.success('CSV exportado');
  };

  const loadReport = (id: string) => {
    const r = reports.find(x => x.id === id);
    if (!r) return;
    setName(r.config.name);
    setEntity(r.config.entity);
    setSelectedFields(r.config.fields);
    setFilters(r.config.filters);
    setGroupBy(r.config.groupBy);
    setAggregations(r.config.aggregations);
    setResult(null);
    toast.success(`Relatório "${r.name}" carregado`);
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Relatórios Customizáveis | SINGU</title>
        <meta name="description" content="Crie relatórios sob medida com filtros, agrupamentos, métricas e exportação CSV." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader backTo="/" backLabel="Dashboard" title="Relatórios Customizáveis" />

        {/* Toolbar */}
        <Card>
          <CardContent className="py-3 flex flex-wrap items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do relatório"
              className="h-8 text-xs max-w-xs"
            />
            <Button size="sm" className="h-8 text-xs" onClick={execute} disabled={loading}>
              <Play className="h-3 w-3 mr-1" /> Executar
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" /> Salvar
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExport} disabled={!result}>
              <Download className="h-3 w-3 mr-1" /> Exportar CSV
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          {/* Left: config + saved */}
          <div className="space-y-4">
            <ReportConfigPanel
              entity={entity}
              setEntity={setEntity}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
              filters={filters}
              setFilters={setFilters}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              aggregations={aggregations}
              setAggregations={setAggregations}
            />

            {reports.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <FolderOpen className="h-4 w-4 text-primary" /> Relatórios Salvos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {reports.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-1 rounded border bg-card px-2 py-1">
                      <button
                        className="text-xs text-left flex-1 hover:text-primary truncate"
                        onClick={() => loadReport(r.id)}
                      >
                        {r.name} <span className="text-muted-foreground">— {ENTITIES[r.config.entity].label}</span>
                      </button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteReport(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: results */}
          <ReportResultView config={buildConfig()} result={result} loading={loading} />
        </div>
      </div>
    </AppLayout>
  );
}
