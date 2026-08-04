import { Copy, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompaniesDuplicatasView } from '@/hooks/useCompaniesDuplicatasView';
import { Link } from 'react-router-dom';

interface DuplicateRecord {
  id?: string;
  name?: string;
  nome_crm?: string;
  cnpj?: string;
  duplicate_count?: number;
  similarity_score?: number;
  duplicate_ids?: string[];
  [key: string]: unknown;
}

export function CompanyDuplicatesPanel() {
  const { data, isLoading, error } = useCompaniesDuplicatasView(20);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Copy className="h-4 w-4" /> Duplicatas de Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Erro ao carregar duplicatas</p>
        </CardContent>
      </Card>
    );
  }

  const records = (data as DuplicateRecord[]) || [];

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Copy className="h-4 w-4 text-success" /> Duplicatas de Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma duplicata detectada — base limpa! ✨
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Possíveis Duplicatas
          <Badge variant="destructive" className="text-[10px] ml-auto">{records.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Empresas com possíveis registros duplicados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {records.map((r, i) => (
            <div key={r.id || i} className="flex items-center gap-3 p-2.5 rounded-lg border text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {r.nome_crm || r.name || 'Sem nome'}
                </p>
                {r.cnpj && <p className="text-xs text-muted-foreground">{r.cnpj}</p>}
              </div>
              {r.duplicate_count != null && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {r.duplicate_count} cópias
                </Badge>
              )}
              {r.similarity_score != null && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {Math.round(Number(r.similarity_score) * 100)}% similar
                </span>
              )}
              {r.id && (
                <Link to={`/empresas/${r.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
