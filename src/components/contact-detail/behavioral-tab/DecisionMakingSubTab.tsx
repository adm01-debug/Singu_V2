import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, Gavel, UserCheck, Wallet, Zap } from 'lucide-react';

interface Props {
  behavior: Record<string, any> | null;
}

export function DecisionMakingSubTab({ behavior }: Props) {
  const criteria = behavior?.decisionCriteria || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            Perfil de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              Velocidade
            </span>
            <Badge variant="outline" className="capitalize">
              {behavior?.decisionSpeed || 'Moderada'}
            </Badge>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5" />
              Necessita Aprovação?
            </span>
            <Badge variant={behavior?.needsApproval ? "destructive" : "success"}>
              {behavior?.needsApproval ? 'Sim' : 'Não / Autônomo'}
            </Badge>
          </div>
          {behavior?.needsApproval && (
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">ID do Aprovador</span>
              <span className="text-xs font-mono">{behavior?.approverContactId || 'Não vinculado'}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" />
              Autoridade de Orçamento
            </span>
            <span className="text-sm font-medium">{behavior?.budgetAuthority || 'Sob consulta'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" />
            Critérios de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criteria.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {criteria.map((item: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Nenhum critério mapeado ainda.
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-4 leading-tight italic">
            * Estes critérios influenciam diretamente o tom e o conteúdo das propostas comerciais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
