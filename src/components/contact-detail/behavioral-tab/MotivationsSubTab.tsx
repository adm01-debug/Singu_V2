import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ShieldAlert, Briefcase, Zap, Goal } from 'lucide-react';

interface Props {
  behavior: Record<string, any> | null;
}

export function MotivationsSubTab({ behavior }: Props) {
  const motivations = [
    { label: 'Motivação Principal', value: behavior?.primaryMotivation, icon: Target, color: 'text-primary' },
    { label: 'Medo Principal', value: behavior?.primaryFear, icon: ShieldAlert, color: 'text-destructive' },
    { label: 'Estágio de Carreira', value: behavior?.careerStage, icon: Briefcase, color: 'text-blue-500' },
    { label: 'Pressão Atual', value: behavior?.currentPressure, icon: Zap, color: 'text-warning' },
    { label: 'Objetivos Profissionais', value: behavior?.professionalGoals, icon: Goal, color: 'text-success' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {motivations.map((item, index) => (
        <Card key={index} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2 bg-muted/30">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-sm font-medium leading-relaxed">
              {item.value || <span className="text-muted-foreground italic font-normal">Não informado</span>}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
