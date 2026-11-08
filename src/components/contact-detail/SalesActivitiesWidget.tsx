import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SalesActivitiesWidget() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4" /> Atividades de Vendas
        </CardTitle>
        <CardDescription className="text-xs">Histórico por contato indisponível</CardDescription>
      </CardHeader>
      <CardContent>
        <p role="status" className="text-sm text-muted-foreground">
          O banco ainda não possui um vínculo entre atividades de vendas e contatos.
          As atividades não podem ser atribuídas com segurança a este contato.
        </p>
      </CardContent>
    </Card>
  );
}
