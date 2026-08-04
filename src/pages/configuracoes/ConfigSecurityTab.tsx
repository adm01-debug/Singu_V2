import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export function ConfigSecurityTab() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Segurança
        </CardTitle>
        <CardDescription>
          Gerencie suas configurações de segurança
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Alterar Senha</p>
                <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
              </div>
              <Button variant="outline" size="sm">Alterar</Button>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Sessões Ativas</p>
                <p className="text-sm text-muted-foreground">Gerencie os dispositivos conectados à sua conta</p>
              </div>
              <Button variant="outline" size="sm">Ver Sessões</Button>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-destructive">Excluir Conta</p>
                <p className="text-sm text-muted-foreground">Exclua permanentemente sua conta e todos os dados</p>
              </div>
              <Button variant="destructive" size="sm">Excluir</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
