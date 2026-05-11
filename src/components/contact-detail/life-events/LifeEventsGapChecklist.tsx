import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LifeEventsGapChecklistProps {
  lifeEvents: Tables<'life_events'>[];
}

export function LifeEventsGapChecklist({ lifeEvents }: LifeEventsGapChecklistProps) {
  const hasBirthday = lifeEvents.some(e => e.event_type === 'birthday');
  const hasAnniversary = lifeEvents.some(e => e.event_type === 'anniversary');
  const hasProfessional = lifeEvents.some(e => e.event_type === 'promotion' || e.event_type === 'achievement');
  
   const hasFamily = lifeEvents.some(e => e.event_type === 'family');
   const hasTravel = lifeEvents.some(e => e.event_type === 'travel');
 
   const gaps = [
     {
       id: 'birthday',
       label: 'Aniversário',
       description: 'Essencial para ações de reciprocidade e lembrança pessoal.',
       missing: !hasBirthday,
       severity: 'high'
     },
     {
       id: 'anniversary',
       label: 'Bodas/Aniversário Relacional',
       description: 'Importante para contatos de alto valor (HVC) e networking profundo.',
       missing: !hasAnniversary,
       severity: 'medium'
     },
     {
       id: 'professional',
       label: 'Marcos Profissionais',
       description: 'Promoções ou conquistas ajudam a validar o sucesso do contato.',
       missing: !hasProfessional,
       severity: 'medium'
     },
     {
       id: 'family',
       label: 'Contexto Familiar',
       description: 'Conhecer a dinâmica familiar humaniza o relacionamento.',
       missing: !hasFamily,
       severity: 'low'
     },
     {
       id: 'travel',
       label: 'Eventos de Lazer/Viagem',
       description: 'Viagens são excelentes ganchos para conversas informais.',
       missing: !hasTravel,
       severity: 'low'
     }
   ];

  const missingCount = gaps.filter(g => g.missing).length;

  if (missingCount === 0) {
    return (
      <Alert className="bg-success/10 border-success/20">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">Perfil de Marcos Completo</AlertTitle>
        <AlertDescription className="text-success/80">
          Você mapeou todos os marcos essenciais para este contato.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        Checklist de Gaps Comportamentais (Módulo 2.4)
      </h4>
      <div className="grid gap-2">
        {gaps.map((gap) => (
          <div 
            key={gap.id}
            className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
              gap.missing 
                ? gap.severity === 'high' ? 'bg-destructive/5 border-destructive/20' : 'bg-warning/5 border-warning/20'
                : 'bg-muted/30 border-border/50'
            }`}
          >
            {gap.missing ? (
              <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                gap.severity === 'high' ? 'text-destructive' : 'text-warning'
              }`} />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-success" />
            )}
            <div>
              <p className={`text-xs font-bold ${gap.missing ? 'text-foreground' : 'text-muted-foreground'}`}>
                {gap.label} {gap.missing && <span className="text-[10px] font-normal opacity-70">(Ausente)</span>}
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {gap.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
