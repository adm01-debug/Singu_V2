import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyStatsView, useCompanyContatoView, useCompanyCoresView } from '@/hooks/useCompanyViews';
import { Users, DollarSign, Phone, Mail, Palette, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CompanyViewsWidget = React.memo(function CompanyViewsWidget({ companyId }: { companyId: string }) {
  const { data: stats, isLoading: statsLoading } = useCompanyStatsView(companyId);
  const { data: contato, isLoading: contatoLoading } = useCompanyContatoView(companyId);
  const { data: cores, isLoading: coresLoading } = useCompanyCoresView(companyId);

  const loading = statsLoading || contatoLoading || coresLoading;

  if (loading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Visão Consolidada</CardTitle></CardHeader><CardContent><Skeleton className="h-24" /></CardContent></Card>;
  if (!stats && !contato && !cores) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />Visão Consolidada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats?.total_contacts != null && (
            <div className="rounded-lg bg-primary/5 p-2 text-center">
              <Users className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
              <p className="text-lg font-bold">{stats.total_contacts}</p>
              <p className="text-[9px] text-muted-foreground">Contatos</p>
            </div>
          )}
          {stats?.total_deals != null && (
            <div className="rounded-lg bg-warning/5 p-2 text-center">
              <DollarSign className="h-3.5 w-3.5 mx-auto mb-0.5 text-warning" />
              <p className="text-lg font-bold">{stats.total_deals}</p>
              <p className="text-[9px] text-muted-foreground">Deals</p>
            </div>
          )}
          {stats?.total_interactions != null && (
            <div className="rounded-lg bg-success/5 p-2 text-center">
              <p className="text-lg font-bold">{stats.total_interactions}</p>
              <p className="text-[9px] text-muted-foreground">Interações</p>
            </div>
          )}
        </div>

        {(contato?.primary_phone || contato?.primary_email) && (
          <div className="mt-3 space-y-1">
            {contato.primary_phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /><span>{contato.primary_phone}</span>
                {contato.total_phones != null && contato.total_phones > 1 && <Badge variant="outline" className="text-[9px]">+{contato.total_phones - 1}</Badge>}
              </div>
            )}
            {contato.primary_email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /><span className="truncate">{contato.primary_email}</span>
                {contato.total_emails != null && contato.total_emails > 1 && <Badge variant="outline" className="text-[9px]">+{contato.total_emails - 1}</Badge>}
              </div>
            )}
          </div>
        )}

        {cores?.cores_marca && (
          <div className="mt-3 flex items-center gap-2">
            <Palette className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Cores:</span>
            <span className="text-xs font-medium">{cores.cores_marca}</span>
          </div>
        )}

        {stats?.avg_relationship_score != null && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Score médio</span>
            <Badge variant="outline" className={cn("text-[10px]",
              stats.avg_relationship_score >= 70 ? "text-success" : stats.avg_relationship_score >= 40 ? "text-warning" : "text-destructive"
            )}>{Math.round(stats.avg_relationship_score)}%</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default CompanyViewsWidget;
