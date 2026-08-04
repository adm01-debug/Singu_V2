import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCog } from 'lucide-react';
import { usePasswordResetRequests } from '@/hooks/usePasswordResetRequests';

export function PasswordResetApproval() {
  const { requests, isLoading, approve, reject } = usePasswordResetRequests();
  const pending = requests.filter(r => r.status === 'pending');

  if (isLoading) return <Skeleton className="h-32" />;
  if (pending.length === 0) return null;

  return (
    <Card className="border-warning/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserCog className="h-4 w-4 text-warning" />
          Aprovação de Reset de Senha
          <Badge variant="destructive" className="text-[10px] ml-auto">{pending.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.slice(0, 5).map(r => (
          <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
            <div>
              <p className="font-medium">{r.email}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => approve(r.id)}>Aprovar</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => reject({ requestId: r.id, reason: 'Negado' })}>Rejeitar</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
