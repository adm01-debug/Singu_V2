import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle, Users2, CalendarClock, ScrollText } from 'lucide-react';

interface Props {
  behavior: Record<string, any> | null;
}

export function BusinessContextSubTab({ behavior }: Props) {
  const challenges = behavior?.currentChallenges || [];
  const competitors = behavior?.competitorsUsed || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Cenário Corporativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground">Saúde Financeira</span>
            <Badge variant="outline" className="text-xs">
              {behavior?.companyFinancialHealth || 'Estável'}
            </Badge>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5" />
              Melhor Momento para Abordagem
            </span>
            <span className="text-xs font-medium">{behavior?.bestTimeToApproach || 'Em horário comercial'}</span>
          </div>
          <div className="space-y-1.5 pt-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <ScrollText className="h-3 w-3" />
              Notas Sazonais:
            </p>
            <p className="text-xs leading-relaxed text-foreground bg-muted/30 p-2 rounded italic">
              {behavior?.seasonalNotes || 'Nenhuma nota sazonal registrada.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Desafios & Concorrência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Users2 className="h-3 w-3" />
              Principais Desafios:
            </p>
            {challenges.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {challenges.map((c: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-[10px]">{c}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nenhum desafio específico mapeado</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Concorrentes Usados:</p>
            {competitors.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {competitors.map((comp: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-[10px] border-destructive/20 text-destructive">{comp}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nenhuma concorrência direta reportada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
