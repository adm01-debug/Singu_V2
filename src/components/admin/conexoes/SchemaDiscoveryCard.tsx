import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Database, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseApiError } from '@/lib/errorMessages';

interface ColumnInfo { column_name: string; data_type: string; is_nullable: string }
interface TableInfo { table_name: string; columns: ColumnInfo[] }
interface DiscoveredSchema { tables: TableInfo[]; table_count: number; discovered_at: string }

interface Props {
  connectionId: string;
  discoveredSchema: DiscoveredSchema | null;
  discoveredAt: string | null;
}

export function SchemaDiscoveryCard({ connectionId, discoveredSchema, discoveredAt }: Props) {
  const qc = useQueryClient();
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const introspect = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('connection-introspect', {
        body: { connection_id: connectionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connection_configs'] });
      toast.success('Schema descoberto');
    },
    onError: (e) => toast.error(`Erro: ${parseApiError(e)}`),
  });

  const tables = discoveredSchema?.tables ?? [];

  return (
    <div className="border border-border/60 rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Schema descoberto</span>
          {discoveredAt && (
            <Badge variant="outline" className="text-xs">
              {tables.length} tabelas · {formatDistanceToNow(new Date(discoveredAt), { locale: ptBR, addSuffix: true })}
            </Badge>
          )}
        </div>
        <Button
          size="sm" variant="ghost"
          onClick={() => introspect.mutate()}
          disabled={introspect.isPending}
        >
          {introspect.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />}
          <span className="ml-1 text-xs">{discoveredAt ? 'Re-descobrir' : 'Descobrir schema'}</span>
        </Button>
      </div>

      {tables.length > 0 && (
        <ScrollArea className="h-48 border border-border/40 rounded p-2">
          <div className="space-y-1">
            {tables.map(t => (
              <Collapsible
                key={t.table_name}
                open={expandedTable === t.table_name}
                onOpenChange={(o) => setExpandedTable(o ? t.table_name : null)}
              >
                <CollapsibleTrigger className="flex items-center gap-1 w-full text-left text-xs py-1 px-2 rounded hover:bg-muted/40">
                  <ChevronRight className={`w-3 h-3 transition-transform ${expandedTable === t.table_name ? 'rotate-90' : ''}`} />
                  <span className="font-mono">{t.table_name}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] h-4">{t.columns.length}</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 py-1 space-y-0.5">
                  {t.columns.map(c => (
                    <div key={c.column_name} className="text-xs flex items-center gap-2 font-mono text-muted-foreground">
                      <span className="text-foreground">{c.column_name}</span>
                      <span className="text-[10px]">{c.data_type}</span>
                      {c.is_nullable === 'NO' && <span className="text-[10px] text-destructive">NOT NULL</span>}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
