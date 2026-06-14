import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpsertAutomation, type ScoreAutomation, type AutomationTrigger, type AutomationAction } from '@/hooks/useScoreAutomations';
import type { AutomationTemplate } from './automation-templates';

type GradeTarget = 'A' | 'B' | 'C' | 'D';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ScoreAutomation | AutomationTemplate | null;
}

export function AutomationWizard({ open, onOpenChange, initial }: Props) {
  const upsert = useUpsertAutomation();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationTrigger>('grade_reached');
  const [gradeTarget, setGradeTarget] = useState<GradeTarget>('A');
  const [scoreTarget, setScoreTarget] = useState<number>(80);
  const [actionType, setActionType] = useState<AutomationAction>('notify');
  const [actionConfig, setActionConfig] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(24);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    if (initial) {
      setName(initial.name);
      setDescription(('description' in initial ? initial.description : '') ?? '');
      setTriggerType(initial.trigger_type);
      setGradeTarget((initial.grade_target as GradeTarget) ?? 'A');
      setScoreTarget(initial.score_target ?? 80);
      setActionType(initial.action_type);
      setActionConfig(Object.fromEntries(
        Object.entries(initial.action_config ?? {}).map(([k, v]) => [k, String(v ?? '')])
      ));
      setCooldown(initial.cooldown_hours ?? 24);
    } else {
      setName(''); setDescription(''); setTriggerType('grade_reached');
      setGradeTarget('A'); setScoreTarget(80); setActionType('notify');
      setActionConfig({}); setCooldown(24);
    }
  }, [open, initial]);

  const isGradeBased = triggerType === 'grade_reached' || triggerType === 'grade_dropped';

  function save() {
    const payload = {
      id: initial && 'id' in initial ? initial.id : undefined,
      name: name.trim() || 'Automação sem nome',
      description: description.trim() || null,
      trigger_type: triggerType,
      grade_target: isGradeBased ? gradeTarget : null,
      score_target: !isGradeBased ? scoreTarget : null,
      action_type: actionType,
      action_config: actionConfig,
      cooldown_hours: cooldown,
      active: true,
    } as Parameters<typeof upsert.mutate>[0];
    upsert.mutate(payload, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial && 'id' in initial ? 'Editar' : 'Nova'} automação · etapa {step + 1}/3</DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>Tipo de gatilho</Label>
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as AutomationTrigger)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade_reached">Quando alcançar uma grade</SelectItem>
                  <SelectItem value="grade_dropped">Quando cair de uma grade</SelectItem>
                  <SelectItem value="score_above">Quando o score subir acima de X</SelectItem>
                  <SelectItem value="score_below">Quando o score cair abaixo de X</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isGradeBased ? (
              <div>
                <Label>Grade alvo</Label>
                <Select value={gradeTarget} onValueChange={(v) => setGradeTarget(v as GradeTarget)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['A','B','C','D'] as const).map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Score alvo (0–100)</Label>
                <Input type="number" min={0} max={100} value={scoreTarget}
                  onChange={(e) => setScoreTarget(Number(e.target.value))} />
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Ação</Label>
              <Select value={actionType} onValueChange={(v) => { setActionType(v as AutomationAction); setActionConfig({}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notify">Criar notificação/alerta</SelectItem>
                  <SelectItem value="create_task">Criar tarefa</SelectItem>
                  <SelectItem value="enroll_sequence">Inscrever em sequência</SelectItem>
                  <SelectItem value="webhook">Disparar webhook</SelectItem>
                  <SelectItem value="tag">Adicionar tag ao contato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(actionType === 'notify' || actionType === 'create_task') && (
              <>
                <div>
                  <Label>Título</Label>
                  <Input value={actionConfig.title ?? ''} onChange={(e) => setActionConfig({ ...actionConfig, title: e.target.value })} placeholder="Ex.: Lead atingiu Grade A" />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea rows={2} value={actionConfig.description ?? ''} onChange={(e) => setActionConfig({ ...actionConfig, description: e.target.value })} />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={actionConfig.priority ?? 'medium'} onValueChange={(v) => setActionConfig({ ...actionConfig, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {actionType === 'create_task' && (
                  <div>
                    <Label>Prazo (horas)</Label>
                    <Input type="number" min={1} value={actionConfig.due_in_hours ?? '24'}
                      onChange={(e) => setActionConfig({ ...actionConfig, due_in_hours: e.target.value })} />
                  </div>
                )}
              </>
            )}

            {actionType === 'enroll_sequence' && (
              <div>
                <Label>ID da sequência</Label>
                <Input value={actionConfig.sequence_id ?? ''} onChange={(e) => setActionConfig({ ...actionConfig, sequence_id: e.target.value })} placeholder="UUID da sequência" />
                <p className="text-xs text-muted-foreground mt-1">Copie o ID da sequência em /sequencias.</p>
              </div>
            )}

            {actionType === 'webhook' && (
              <>
                <div>
                  <Label>URL do webhook</Label>
                  <Input type="url" value={actionConfig.url ?? ''} onChange={(e) => setActionConfig({ ...actionConfig, url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Secret (opcional)</Label>
                  <Input value={actionConfig.secret ?? ''} onChange={(e) => setActionConfig({ ...actionConfig, secret: e.target.value })} placeholder="Enviado em X-Webhook-Secret" />
                </div>
              </>
            )}

            {actionType === 'tag' && (
              <div>
                <Label>Tag a adicionar</Label>
                <Input value={actionConfig.tag ?? ''} onChange={(e) => setActionConfig({ ...actionConfig, tag: e.target.value })} placeholder="hot, vip, ..." />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Nome da automação</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Lead Hot → notificar AE" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Cooldown (horas)</Label>
              <Input type="number" min={0} value={cooldown} onChange={(e) => setCooldown(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">Tempo mínimo entre disparos para o mesmo contato.</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex sm:justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Voltar</Button>
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)}>Próximo</Button>
          ) : (
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending ? 'Salvando…' : 'Salvar automação'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
