import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, HeartHandshake, ArrowRightLeft } from 'lucide-react';

interface Props {
  behavior: Record<string, any> | null;
}

export function InfluencersSubTab({ behavior }: Props) {
  const influencers = behavior?.influencedByIds || [];
  const influenced = behavior?.influencesIds || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Crown className="h-4 w-4 text-warning" />
            Poder & Papel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground">Papel Decisório</span>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {behavior?.decisionRole || 'Stakeholder'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
              <span>Poder de Decisão</span>
              <span>{behavior?.decisionPower || 5}/10</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${(behavior?.decisionPower || 5) * 10}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
              <span>Nível de Suporte (Champion)</span>
              <span>{behavior?.supportLevel || 5}/10</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-500" 
                style={{ width: `${(behavior?.supportLevel || 5) * 10}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            Rede de Influência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Influenciado por:
            </p>
            {influencers.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {influencers.map((id: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-[10px]">{id}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nenhum influenciador direto</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <HeartHandshake className="h-3 w-3" />
              Influencia:
            </p>
            {influenced.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {influenced.map((id: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-[10px]">{id}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Não influencia outros decisores conhecidos</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
