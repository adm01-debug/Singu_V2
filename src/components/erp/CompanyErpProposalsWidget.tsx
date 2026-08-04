import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ExternalLink, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useErpProposals } from '@/hooks/useErpData';

function formatBRL(value: number | null | undefined) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Compact widget for company detail pages — shows ERP proposals tied to this company */
export function CompanyErpProposalsWidget({ companyId }: { companyId: string }) {
  const { data, isLoading } = useErpProposals(20, companyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Propostas (ERP)</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-16" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />Propostas (ERP)
          <Badge variant="outline" className="text-[10px] ml-auto">{data?.length ?? 0}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Sincronizado do sistema de origem · somente leitura</CardDescription>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="text-center py-4">
            <Inbox className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-60" />
            <p className="text-xs text-muted-foreground">Nenhuma proposta no ERP.</p>
            <Link to="/erp" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
              Ver catálogo <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {data.slice(0, 5).map((p) => (
              <div key={String(p.id)} className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-xs">
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.numero ?? `#${p.id}`}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.status ?? '—'}</p>
                </div>
                <span className="tabular-nums text-xs font-medium shrink-0 ml-2">{formatBRL(p.valor_total)}</span>
              </div>
            ))}
            {data.length > 5 && (
              <Link to="/erp" className="text-xs text-primary inline-flex items-center gap-1 pt-1">
                Ver todas ({data.length}) <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CompanyErpProposalsWidget;
