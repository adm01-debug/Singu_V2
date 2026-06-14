import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { usePasswordResetRequests } from '@/hooks/usePasswordResetRequests';

export default function AdminSegurancaPage() {
  const { requests, isLoading, approve, reject } = usePasswordResetRequests();

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  return (
    <>
      <Helmet>
        <title>Admin · Segurança · SINGU CRM</title>
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Administração de Segurança</h1>
          <p className="text-sm text-muted-foreground">Gerencie solicitações de reset e acessos</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />Solicitações de Reset de Senha
              {pending.length > 0 && <Badge variant="destructive" className="text-[10px]">{pending.length} pendentes</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma solicitação registrada.</p>
            ) : (
              <div className="space-y-3">
                {pending.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-warning/30 bg-warning/5">
                    <div>
                      <p className="text-sm font-medium">{r.email}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => approve(r.id)}>Aprovar</Button>
                      <Button size="sm" variant="destructive" onClick={() => reject({ requestId: r.id, reason: 'Negado pelo admin' })}>Rejeitar</Button>
                    </div>
                  </div>
                ))}
                {resolved.slice(0, 10).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm">{r.email}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <Badge variant={r.status === 'approved' ? 'default' : 'destructive'} className="text-[10px] gap-1">
                      {r.status === 'approved' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {r.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
