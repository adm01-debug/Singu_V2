import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Static mapping data (mirrors FIELD_MAPPING.md) ──

interface FieldMapping {
  local: string;
  external: string;
  type: string;
  transformation: string;
  notes: string;
}

const COMPANY_MAPPINGS: FieldMapping[] = [
  { local: 'id', external: 'id', type: 'UUID', transformation: '—', notes: 'PK' },
  { local: 'name', external: 'nome_crm / nome_fantasia / razao_social', type: 'TEXT', transformation: 'Fallback chain', notes: 'Campo virtual' },
  { local: 'nome_fantasia', external: 'nome_fantasia', type: 'TEXT', transformation: '—', notes: '' },
  { local: 'razao_social', external: 'razao_social', type: 'TEXT', transformation: '—', notes: '' },
  { local: 'cnpj', external: 'cnpj', type: 'TEXT', transformation: '—', notes: '14 dígitos' },
  { local: 'cnpj_base', external: 'cnpj_base', type: 'TEXT', transformation: '—', notes: '8 primeiros dígitos' },
  { local: 'industry', external: 'ramo_atividade / nicho_cliente', type: 'TEXT', transformation: 'Fallback', notes: 'Campo virtual' },
  { local: 'ramo_atividade', external: 'ramo_atividade', type: 'TEXT', transformation: '—', notes: '' },
  { local: 'nicho_cliente', external: 'nicho_cliente', type: 'TEXT', transformation: '—', notes: '' },
  { local: 'tags', external: 'tags_array', type: 'TEXT[]', transformation: 'Renomeado', notes: '' },
  { local: 'city', external: 'city', type: 'TEXT', transformation: 'extractLocationFromName()', notes: 'Parsed do nome' },
  { local: 'state', external: 'state', type: 'TEXT', transformation: 'extractLocationFromName()', notes: 'Parsed do nome' },
  { local: 'status', external: 'status', type: 'TEXT', transformation: '—', notes: "Default: 'ativo'" },
  { local: 'is_customer', external: 'is_customer', type: 'BOOLEAN', transformation: '—', notes: '' },
  { local: 'is_carrier', external: 'is_carrier', type: 'BOOLEAN', transformation: '—', notes: '' },
  { local: 'is_supplier', external: 'is_supplier', type: 'BOOLEAN', transformation: '—', notes: '' },
  { local: 'capital_social', external: 'capital_social', type: 'NUMERIC', transformation: '—', notes: '' },
  { local: 'grupo_economico', external: 'grupo_economico', type: 'TEXT', transformation: '—', notes: '' },
  { local: 'tipo_cooperativa', external: 'tipo_cooperativa', type: 'TEXT', transformation: '—', notes: '' },
  { local: 'website', external: 'website', type: 'TEXT', transformation: '—', notes: '' },
  { local: 'logo_url', external: 'logo_url', type: 'TEXT', transformation: '—', notes: '' },
  { local: 'bitrix_company_id', external: 'bitrix_company_id', type: 'INTEGER', transformation: '—', notes: '' },
  { local: 'lead_score', external: 'lead_score', type: 'INTEGER', transformation: '—', notes: 'Só externo' },
  { local: 'lead_status', external: 'lead_status', type: 'TEXT', transformation: '—', notes: 'Só externo' },
];

const RPC_LIST = [
  { name: 'get_complete_dashboard', params: 'p_user_id', returns: 'JSON', description: 'Dashboard completo com todos KPIs' },
  { name: 'get_executive_dashboard', params: '—', returns: 'JSON', description: 'Visão executiva condensada' },
  { name: 'get_instant_kpis', params: '—', returns: 'JSON', description: 'KPIs em tempo real' },
  { name: 'get_business_alerts', params: '—', returns: 'JSON[]', description: 'Alertas de negócio ativos' },
  { name: 'search_contacts', params: 'p_query', returns: 'JSON[]', description: 'Busca simples por texto' },
  { name: 'get_contact_intelligence', params: 'p_contact_id', returns: 'JSON', description: 'Inteligência completa do contato' },
  { name: 'get_contact_disc_profile', params: 'p_contact_id', returns: 'JSON', description: 'Perfil DISC calculado' },
  { name: 'get_company_health_score', params: 'p_company_id', returns: 'JSON', description: 'Score de saúde da empresa' },
  { name: 'get_company_360_view', params: 'p_company_id', returns: 'JSON', description: 'Visão 360° da empresa' },
  { name: 'get_deals_pipeline', params: 'p_user_id', returns: 'JSON[]', description: 'Pipeline de deals' },
  { name: 'get_pipeline_summary', params: 'p_user_id', returns: 'JSON', description: 'Resumo do pipeline' },
  { name: 'get_rfm_dashboard', params: '—', returns: 'JSON', description: 'Dashboard RFM' },
  { name: 'get_territories', params: '—', returns: 'JSON[]', description: 'Listar territórios' },
  { name: 'get_pending_tasks', params: '—', returns: 'JSON[]', description: 'Tarefas pendentes' },
  { name: 'get_leaderboard', params: '—', returns: 'JSON[]', description: 'Ranking' },
];

interface SchemaResult {
  tableCount: number;
  tables: Record<string, { columns: { name: string; type: string; format: string; required: boolean }[] }>;
  functions: string[];
}

interface Discrepancy {
  field: string;
  issue: string;
  severity: 'warning' | 'error';
}

export default function FieldMappingDocs() {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  // Fetch external schema
  const { data: schema, isLoading: schemaLoading, refetch: refetchSchema } = useQuery<SchemaResult | null>({
    queryKey: ['external-schema-introspection'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'schema' }),
        }
      );
      if (!res.ok) return null;
      return res.json();
    },
    enabled: false, // Manual trigger only
    staleTime: Infinity,
  });

  // Compute discrepancies
  const discrepancies = useMemo<Discrepancy[]>(() => {
    if (!schema?.tables) return [];
    const issues: Discrepancy[] = [];
    const extCompanyCols = schema.tables['companies']?.columns.map(c => c.name) ?? [];

    for (const mapping of COMPANY_MAPPINGS) {
      if (mapping.notes === 'Campo virtual' || mapping.notes === 'Só externo') continue;
      const extField = mapping.external.split(' / ')[0].trim();
      if (extField !== '—' && !extCompanyCols.includes(extField)) {
        issues.push({
          field: mapping.local,
          issue: `Campo externo "${extField}" não encontrado na tabela companies`,
          severity: 'error',
        });
      }
    }

    return issues;
  }, [schema]);

  const handleVerify = () => {
    refetchSchema();
    toast.info('Verificando schema do banco externo...');
  };

  // Filter mappings
  const q = search.toLowerCase();
  const filteredMappings = COMPANY_MAPPINGS.filter(m =>
    !q || m.local.includes(q) || m.external.includes(q) || m.notes.toLowerCase().includes(q)
  );
  const filteredRpcs = RPC_LIST.filter(r =>
    !q || r.name.includes(q) || r.description.toLowerCase().includes(q)
  );

  return (
    <AppLayout title="Mapeamento de Campos">
      <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Mapeamento de Campos</h1>
          </div>
          <Button size="sm" variant="outline" onClick={handleVerify} disabled={schemaLoading}>
            {schemaLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Verificar Schema
          </Button>
        </div>

        {/* Discrepancies */}
        {discrepancies.length > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                {discrepancies.length} discrepância(s) encontrada(s)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {discrepancies.map((d, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  <Badge variant={d.severity === 'error' ? 'destructive' : 'secondary'} className="text-[10px] mr-1">
                    {d.severity}
                  </Badge>
                  <strong>{d.field}</strong>: {d.issue}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {schema && discrepancies.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Schema verificado — nenhuma discrepância encontrada
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar campo ou RPC..." className="pl-9 h-9" />
        </div>

        {/* Schema stats */}
        {schema && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{schema.tableCount} tabelas no externo</span>
            <span>·</span>
            <span>{schema.functions?.length ?? 0} RPCs detectadas</span>
          </div>
        )}

        <Tabs defaultValue="companies" className="w-full">
          <TabsList>
            <TabsTrigger value="companies">Companies ({filteredMappings.length})</TabsTrigger>
            <TabsTrigger value="rpcs">RPCs ({filteredRpcs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">Campo Local</th>
                    <th className="px-3 py-2 font-medium">Campo Externo</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Transformação</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMappings.map((m, i) => {
                    const extField = m.external.split(' / ')[0].trim();
                    const extCols = schema?.tables?.['companies']?.columns.map(c => c.name) ?? [];
                    const exists = !schema || m.notes === 'Campo virtual' || m.notes === 'Só externo' || extCols.includes(extField);

                    return (
                      <tr key={i} className="border-t border-border/50 hover:bg-muted/30">
                        <td className="px-3 py-1.5 font-mono text-xs">{m.local}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{m.external}</td>
                        <td className="px-3 py-1.5"><Badge variant="outline" className="text-[10px]">{m.type}</Badge></td>
                        <td className="px-3 py-1.5 text-xs text-muted-foreground">{m.transformation}</td>
                        <td className="px-3 py-1.5">
                          {schema ? (
                            exists ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                            )
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-muted-foreground">{m.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="rpcs">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">RPC</th>
                    <th className="px-3 py-2 font-medium">Parâmetros</th>
                    <th className="px-3 py-2 font-medium">Retorno</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRpcs.map((r, i) => {
                    const extFns = schema?.functions ?? [];
                    const exists = !schema || extFns.includes(r.name);

                    return (
                      <tr key={i} className="border-t border-border/50 hover:bg-muted/30">
                        <td className="px-3 py-1.5 font-mono text-xs">{r.name}</td>
                        <td className="px-3 py-1.5 text-xs">{r.params}</td>
                        <td className="px-3 py-1.5"><Badge variant="outline" className="text-[10px]">{r.returns}</Badge></td>
                        <td className="px-3 py-1.5">
                          {schema ? (
                            exists ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                            )
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-muted-foreground">{r.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
