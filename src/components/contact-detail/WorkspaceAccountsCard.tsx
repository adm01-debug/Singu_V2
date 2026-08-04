import { Building2, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceAccounts } from '@/hooks/useWorkspaceAccounts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
  pending: 'outline',
};

export function WorkspaceAccountsCard({ contactId }: Props) {
  const { data: accounts, isLoading } = useWorkspaceAccounts(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            Workspace Accounts
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-12 w-full" /></CardContent>
      </Card>
    );
  }

  if (!accounts || accounts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          Workspace Accounts
          <Badge variant="secondary" className="text-[10px] ml-auto">{accounts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {accounts.map(acc => (
          <div key={acc.id} className="rounded-lg border p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {acc.workspace_name || 'Workspace'}
              </span>
              {acc.account_status && (
                <Badge variant={STATUS_VARIANT[acc.account_status] || 'outline'} className="text-[10px]">
                  {acc.account_status}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {acc.account_type && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {acc.account_type}
                </span>
              )}
              {acc.role_in_workspace && (
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {acc.role_in_workspace}
                </span>
              )}
              {acc.last_active_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(acc.last_active_at), "dd/MM/yy", { locale: ptBR })}
                </span>
              )}
            </div>

            {acc.permissions && acc.permissions.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {acc.permissions.slice(0, 5).map(p => (
                  <Badge key={p} variant="outline" className="text-[9px]">{p}</Badge>
                ))}
                {acc.permissions.length > 5 && (
                  <Badge variant="outline" className="text-[9px]">+{acc.permissions.length - 5}</Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
