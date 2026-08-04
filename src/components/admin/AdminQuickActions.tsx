import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeWithTrace } from '@/lib/supabaseInvoke';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HeartPulse, Trash2, Download, FlaskConical, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function AdminQuickActions() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const setActionLoading = (key: string, val: boolean) =>
    setLoading(prev => ({ ...prev, [key]: val }));

  const checkHealth = useCallback(async () => {
    setActionLoading('health', true);
    try {
      const { data, error } = await invokeWithTrace<{ status?: string }>('health', { body: {} });
      if (error) throw error;
      const status = data?.status || 'unknown';
      if (status === 'healthy') {
        toast.success('✅ Sistema saudável');
      } else {
        toast.warning(`⚠️ Status: ${status}`);
      }
    } catch {
      toast.error('Erro ao verificar saúde do sistema');
    } finally {
      setActionLoading('health', false);
    }
  }, []);

  const clearCache = useCallback(() => {
    window.location.reload();
    toast.success('Cache limpo — página recarregada');
  }, []);

  const exportLogs = useCallback(async () => {
    setActionLoading('logs', true);
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data?.length || 0} registros exportados`);
    } catch {
      toast.error('Erro ao exportar logs');
    } finally {
      setActionLoading('logs', false);
    }
  }, []);

  const runTests = useCallback(async () => {
    setActionLoading('tests', true);
    try {
      const results: { name: string; ok: boolean }[] = [];

      // Test health endpoint
      const { error: healthErr } = await invokeWithTrace('health', { body: {} });
      results.push({ name: 'Health Check', ok: !healthErr });

      // Test DB connection
      const { error: dbErr } = await supabase.from('profiles').select('id').limit(1);
      results.push({ name: 'Database Local', ok: !dbErr });

      // Test external data
      const { error: extErr } = await invokeWithTrace('external-data', {
        body: { action: 'select', table: 'contacts', select: 'id', range: { from: 0, to: 0 } },
      });
      results.push({ name: 'Banco Externo', ok: !extErr });

      const passed = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok);

      if (failed.length === 0) {
        toast.success(`✅ ${passed}/${results.length} testes passaram`);
      } else {
        toast.warning(`⚠️ ${passed}/${results.length} — Falhas: ${failed.map(f => f.name).join(', ')}`);
      }
    } catch {
      toast.error('Erro ao rodar testes');
    } finally {
      setActionLoading('tests', false);
    }
  }, []);

  const actions = [
    { key: 'health', label: 'Verificar Saúde', icon: HeartPulse, onClick: checkHealth, variant: 'outline' as const },
    { key: 'cache', label: 'Limpar Cache', icon: Trash2, onClick: clearCache, variant: 'outline' as const },
    { key: 'logs', label: 'Exportar Logs', icon: Download, onClick: exportLogs, variant: 'outline' as const },
    { key: 'tests', label: 'Rodar Testes', icon: FlaskConical, onClick: runTests, variant: 'outline' as const },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map(action => (
            <Button
              key={action.key}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              disabled={loading[action.key]}
            >
              {loading[action.key]
                ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                : <action.icon className="w-4 h-4 mr-1" />}
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
