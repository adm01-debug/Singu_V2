import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Workflow, Plus, Play, Pause, Trash2, Users, ArrowRight, Mail, MessageSquare, Clock, CheckSquare } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNurturingWorkflows, NurturingStep } from '@/hooks/useNurturingWorkflows';

const STEP_ICONS: Record<string, typeof Mail> = { email: Mail, whatsapp: MessageSquare, task: CheckSquare, wait: Clock };
const STEP_LABELS: Record<string, string> = { email: 'Email', whatsapp: 'WhatsApp', task: 'Tarefa', wait: 'Aguardar' };
const TRIGGER_LABELS: Record<string, string> = { manual: 'Manual', tag_added: 'Tag adicionada', stage_changed: 'Estágio mudou', score_below: 'Score abaixo de', score_above: 'Score acima de' };

export default function NurturingPage() {
  const { workflows, isLoading, create, remove, toggleActive } = useNurturingWorkflows();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('manual');
  const [steps, setSteps] = useState<NurturingStep[]>([]);

  const addStep = (type: NurturingStep['type']) => {
    setSteps(prev => [...prev, { type, delay_days: type === 'wait' ? 3 : 0, content: '', subject: '' }]);
  };

  const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx));

  const handleCreate = () => {
    if (!name.trim()) return;
    create.mutate({ name, description, trigger_type: triggerType, steps });
    setName(''); setDescription(''); setSteps([]); setShowNew(false);
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Nurturing | SINGU</title>
        <meta name="description" content="Workflows automáticos de nutrição de leads multi-etapa." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader backTo="/" backLabel="Dashboard" title="Nurturing Workflows" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 flex items-center gap-3"><Workflow className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{workflows.length}</p><p className="text-xs text-muted-foreground">Workflows</p></div></CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3"><Play className="h-5 w-5 text-green-500" /><div><p className="text-2xl font-bold">{workflows.filter(w => w.is_active).length}</p><p className="text-xs text-muted-foreground">Ativos</p></div></CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3"><Users className="h-5 w-5 text-blue-500" /><div><p className="text-2xl font-bold">{workflows.reduce((s, w) => s + w.enrolled_count, 0)}</p><p className="text-xs text-muted-foreground">Inscritos</p></div></CardContent></Card>
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowNew(true)} className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Novo Workflow
          </Button>
        </div>

        {/* Workflow list */}
        <div className="space-y-3">
          {isLoading ? <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p> :
           workflows.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhum workflow criado.</p> :
           workflows.map(wf => (
            <Card key={wf.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{wf.name}</h3>
                      <Badge variant={wf.is_active ? 'default' : 'secondary'} className="text-[10px] h-4">
                        {wf.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {wf.description && <p className="text-[10px] text-muted-foreground mt-0.5">{wf.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => toggleActive.mutate({ id: wf.id, is_active: !wf.is_active })}>
                      {wf.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => remove.mutate(wf.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Steps visualization */}
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] h-5">{TRIGGER_LABELS[wf.trigger_type]}</Badge>
                  {wf.steps.map((step, i) => {
                    const Icon = STEP_ICONS[step.type] || Clock;
                    return (
                      <div key={i} className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-[10px] h-5 flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {STEP_LABELS[step.type]}
                          {step.delay_days > 0 && <span className="text-muted-foreground">({step.delay_days}d)</span>}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {/* Metrics */}
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <span>📥 {wf.enrolled_count} inscritos</span>
                  <span>✅ {wf.completed_count} concluídos</span>
                  <span>📊 {wf.steps.length} etapas</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Workflow Dialog */}
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Workflow de Nurturing</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Onboarding de novos leads" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Objetivo do workflow..." className="text-xs min-h-[60px]" />
              </div>
              <div>
                <Label className="text-xs">Gatilho</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Steps builder */}
              <div>
                <Label className="text-xs">Etapas</Label>
                <div className="space-y-1.5 mt-1">
                  {steps.map((step, i) => {
                    const Icon = STEP_ICONS[step.type];
                    return (
                      <div key={i} className="flex items-center gap-2 bg-muted/30 rounded p-2">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs">{STEP_LABELS[step.type]}</span>
                        {step.type === 'wait' && (
                          <Input
                            type="number" value={step.delay_days} className="h-6 w-14 text-[10px]"
                            // eslint-disable-next-line sonarjs/no-nested-functions
                            onChange={e => setSteps(prev => prev.map((s, j) => j === i ? { ...s, delay_days: Number(e.target.value) } : s))}
                          />
                        )}
                        {step.type === 'wait' && <span className="text-[10px] text-muted-foreground">dias</span>}
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto" onClick={() => removeStep(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-2">
                  {(['email', 'whatsapp', 'task', 'wait'] as const).map(type => {
                    const Icon = STEP_ICONS[type];
                    return (
                      <Button key={type} variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => addStep(type)}>
                        <Icon className="h-3 w-3 mr-1" /> {STEP_LABELS[type]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)} className="text-xs">Cancelar</Button>
              <Button onClick={handleCreate} disabled={!name.trim() || create.isPending} className="text-xs">Criar Workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
