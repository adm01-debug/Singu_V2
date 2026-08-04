import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyDuplicates } from '@/hooks/useCompanyIntelligence';
import { AlertTriangle, Copy } from 'lucide-react';

export const CompanyDuplicatesWidget = React.memo(function CompanyDuplicatesWidget({ companyId }: { companyId: string }) {
  const { data: duplicates, isLoading } = useCompanyDuplicates(companyId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Duplicatas</CardTitle></CardHeader><CardContent><Skeleton className="h-16" /></CardContent></Card>;
  if (!duplicates || duplicates.length === 0) return null;

  return (
    <Card className="border-warning/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />Possíveis Duplicatas
          <Badge variant="outline" className="text-[10px] ml-auto text-warning border-warning/30">{duplicates.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Empresas com dados semelhantes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[150px] overflow-y-auto">
          {duplicates.map((dup) => (
            <div key={dup.id} className="flex items-center justify-between p-2 rounded-lg bg-warning/5 border border-warning/10">
              <div className="flex items-center gap-2 min-w-0">
                <Copy className="h-3.5 w-3.5 text-warning shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{dup.name || 'N/A'}</p>
                  {dup.cnpj && <p className="text-[10px] text-muted-foreground">{dup.cnpj}</p>}
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] shrink-0">{Math.round(dup.similarity * 100)}%</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default CompanyDuplicatesWidget;
