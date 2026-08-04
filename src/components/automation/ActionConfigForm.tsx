import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AutomationAction } from '@/hooks/useAutomationRules';

interface ActionConfigFormProps {
  action: AutomationAction;
  onChange: (config: Record<string, unknown>) => void;
}

export function ActionConfigForm({ action, onChange }: ActionConfigFormProps) {
  const config = action.config || {};

  const updateField = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  switch (action.type) {
    case 'create_alert':
      return (
        <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
          <div>
            <Label className="text-xs">Título do alerta</Label>
            <Input className="text-xs h-8" value={String(config.title || '')} onChange={e => updateField('title', e.target.value)} placeholder="Ex: Contato precisa de atenção" />
          </div>
          <div>
            <Label className="text-xs">Prioridade</Label>
            <Select value={String(config.priority || 'medium')} onValueChange={v => updateField('priority', v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'create_task':
      return (
        <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
          <div>
            <Label className="text-xs">Título da tarefa</Label>
            <Input className="text-xs h-8" value={String(config.title || '')} onChange={e => updateField('title', e.target.value)} placeholder="Ex: Ligar para o contato" />
          </div>
        </div>
      );

    case 'update_stage':
      return (
        <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
          <div>
            <Label className="text-xs">Novo estágio</Label>
            <Select value={String(config.stage || '')} onValueChange={v => updateField('stage', v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="at_risk">Em Risco</SelectItem>
                <SelectItem value="advocate">Advocate</SelectItem>
                <SelectItem value="churned">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'add_tag':
      return (
        <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
          <div>
            <Label className="text-xs">Tag</Label>
            <Input className="text-xs h-8" value={String(config.tag || '')} onChange={e => updateField('tag', e.target.value)} placeholder="Ex: vip, urgente" />
          </div>
        </div>
      );

    case 'send_notification':
      return (
        <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
          <div>
            <Label className="text-xs">Mensagem</Label>
            <Input className="text-xs h-8" value={String(config.message || '')} onChange={e => updateField('message', e.target.value)} placeholder="Ex: Contato precisa de atenção" />
          </div>
        </div>
      );

    case 'update_score':
      return (
        <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
          <div>
            <Label className="text-xs">Alteração (+/-)</Label>
            <Input className="text-xs h-8" type="number" value={String(config.delta || '')} onChange={e => updateField('delta', Number(e.target.value))} placeholder="Ex: 5 ou -10" />
          </div>
        </div>
      );

    default:
      return null;
  }
}
