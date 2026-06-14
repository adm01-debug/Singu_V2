import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TRIGGER_OPTIONS, ACTION_OPTIONS, type CreateRuleData, type AutomationAction, type AutomationCondition, type TriggerType, type ActionType } from '@/hooks/useAutomationRules';
import { ConditionBuilder } from '@/components/automation/ConditionBuilder';
import { ActionConfigForm } from '@/components/automation/ActionConfigForm';

interface RuleFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: CreateRuleData) => void;
  initialData?: CreateRuleData & { id?: string };
}

export function RuleFormDialog({ open, onOpenChange, onSubmit, initialData }: RuleFormDialogProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [triggerType, setTriggerType] = useState<TriggerType>(initialData?.trigger_type ?? 'interaction_created');
  const [triggerConfig, setTriggerConfig] = useState<string>(
    initialData?.trigger_config ? JSON.stringify(initialData.trigger_config, null, 2) : '{}'
  );
  const [conditions, setConditions] = useState<AutomationCondition[]>(initialData?.conditions ?? []);
  const [actions, setActions] = useState<AutomationAction[]>(
    initialData?.actions ?? [{ type: 'create_alert', config: { title: 'Alerta automático' } }]
  );

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setDescription(initialData?.description ?? '');
      setTriggerType(initialData?.trigger_type ?? 'interaction_created');
      setTriggerConfig(initialData?.trigger_config ? JSON.stringify(initialData.trigger_config, null, 2) : '{}');
      setConditions(initialData?.conditions ?? []);
      setActions(initialData?.actions ?? [{ type: 'create_alert', config: { title: 'Alerta automático' } }]);
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    let parsedConfig = {};
    try { parsedConfig = JSON.parse(triggerConfig); } catch { /* keep empty */ }
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      trigger_type: triggerType,
      trigger_config: parsedConfig,
      conditions,
      actions,
    });
    onOpenChange(false);
  };

  const updateAction = (index: number, type: ActionType) => {
    setActions(prev => prev.map((a, i) => i === index ? { ...a, type } : a));
  };

  const updateActionConfig = (index: number, config: Record<string, unknown>) => {
    setActions(prev => prev.map((a, i) => i === index ? { ...a, config } : a));
  };

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions(prev => [...prev, { type: 'create_alert', config: { title: '' } }]);
  };

  const triggerMeta = TRIGGER_OPTIONS.find(t => t.value === triggerType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {initialData?.id ? 'Editar Automação' : 'Nova Automação'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="rule-name">Nome da regra *</Label>
              <Input id="rule-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Alertar quando score cair" />
            </div>
            <div>
              <Label htmlFor="rule-desc">Descrição</Label>
              <Textarea id="rule-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que esta automação faz..." rows={2} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">🎯 Quando (Trigger)</Label>
            <Select value={triggerType} onValueChange={v => setTriggerType(v as TriggerType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2"><span>{t.icon}</span><span>{t.label}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {triggerMeta && <p className="text-xs text-muted-foreground">{triggerMeta.description}</p>}

            {triggerType === 'no_contact_days' && (
              <div>
                <Label className="text-xs">Dias mínimos sem contato</Label>
                <Input
                  type="number" className="text-xs h-8 w-32"
                  value={(() => { try { return JSON.parse(triggerConfig)?.min_days || ''; } catch { return ''; } })()}
                  onChange={e => setTriggerConfig(JSON.stringify({ min_days: Number(e.target.value) }))}
                  placeholder="14"
                />
              </div>
            )}
            {triggerType === 'score_changed' && (
              <div className="flex gap-2">
                <div>
                  <Label className="text-xs">Direção</Label>
                  <Select
                    value={(() => { try { return JSON.parse(triggerConfig)?.direction || 'decrease'; } catch { return 'decrease'; } })()}
                    onValueChange={v => {
                      let cfg = {}; try { cfg = JSON.parse(triggerConfig); } catch { /* JSON inválido: mantém cfg vazio */ }
                      setTriggerConfig(JSON.stringify({ ...cfg, direction: v }));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Aumento</SelectItem>
                      <SelectItem value="decrease">Queda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Threshold</Label>
                  <Input
                    type="number" className="text-xs h-8 w-24"
                    value={(() => { try { return JSON.parse(triggerConfig)?.threshold || ''; } catch { return ''; } })()}
                    onChange={e => {
                      let cfg = {}; try { cfg = JSON.parse(triggerConfig); } catch { /* JSON inválido: mantém cfg vazio */ }
                      setTriggerConfig(JSON.stringify({ ...cfg, threshold: Number(e.target.value) }));
                    }}
                    placeholder="10"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />
          <ConditionBuilder conditions={conditions} onChange={setConditions} />
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">⚡ Então (Ações)</Label>
              <Button variant="outline" size="sm" onClick={addAction}><Plus className="w-3 h-3 mr-1" /> Ação</Button>
            </div>
            {actions.map((action, i) => (
              <div key={i} className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Select value={action.type} onValueChange={v => updateAction(i, v as ActionType)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>
                          <span className="flex items-center gap-2"><span>{a.icon}</span><span>{a.label}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {actions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAction(i)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <ActionConfigForm action={action} onChange={(cfg) => updateActionConfig(i, cfg)} />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            <Zap className="w-4 h-4 mr-2" />
            {initialData?.id ? 'Salvar' : 'Criar Automação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
