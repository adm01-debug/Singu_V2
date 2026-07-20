import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ScoreAutomation } from '@/hooks/useScoreAutomations';
import { useToggleAutomation, useDeleteAutomation } from '@/hooks/useScoreAutomations';

interface Props {
  automation: ScoreAutomation;
  onEdit?: (a: ScoreAutomation) => void;
}

const TRIGGER_LABEL: Record<string, string> = {
  grade_reached: 'Grade alcançada',
  grade_dropped: 'Grade caiu',
  score_above: 'Score acima',
  score_below: 'Score abaixo',
};

const ACTION_LABEL: Record<string, string> = {
  notify: 'Notificar',
  create_task: 'Criar tarefa',
  enroll_sequence: 'Inscrever em sequência',
  webhook: 'Webhook',
  tag: 'Adicionar tag',
};

function AutomationCardInner({ automation, onEdit }: Props) {
  const toggle = useToggleAutomation();
  const del = useDeleteAutomation();

  const target = automation.grade_target
    ? `Grade ${automation.grade_target}`
    : automation.score_target != null
    ? `${automation.score_target} pts`
    : '—';

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-sm truncate">{automation.name}</h3>
            </div>
            {automation.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{automation.description}</p>
            )}
          </div>
          <Switch
            checked={automation.active}
            onCheckedChange={(v) => toggle.mutate({ id: automation.id, active: v })}
            aria-label="Ativar automação"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]">{TRIGGER_LABEL[automation.trigger_type]}</Badge>
          <Badge variant="secondary" className="text-[10px]">{target}</Badge>
          <Badge variant="outline" className="text-[10px]">→ {ACTION_LABEL[automation.action_type]}</Badge>
          <Badge variant="outline" className="text-[10px]">cooldown {automation.cooldown_hours}h</Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div>
            {automation.fired_count} disparos
            {automation.last_fired_at && (
              <span className="ml-2">
                · último {format(new Date(automation.last_fired_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button size="icon" aria-label="Editar" variant="ghost" className="h-7 w-7" onClick={() => onEdit(automation)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
       <Button
              size="icon" aria-label="Remover"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm(`Excluir "${automation.name}"?`)) del.mutate(automation.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>           </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const AutomationCard = memo(AutomationCardInner);
