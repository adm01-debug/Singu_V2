import React, { useState, useEffect } from 'react';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CalendarClock, Plus, ShieldCheck, History, Trash2, Settings2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { RELATIONSHIP_STAGE_LABELS } from '@/types';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

type CadenceStepType = 'message' | 'call' | 'email' | 'task';
type CadencePriority = 'low' | 'medium' | 'high' | 'urgent';

interface CadenceStep {
  _localId?: string;
  type: CadenceStepType;
  delay_days: number;
  content: string;
}

let _stepCounter = 0;
const nextStepId = () => `step-${++_stepCounter}`;

interface CadenceRule {
  id?: string;
  relationship_stage: string;
  frequency_days: number;
  priority: CadencePriority;
  cadence_steps: CadenceStep[];
  is_active?: boolean;
}

export function CadenceRulesConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CadenceRule | null>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['crm-cadence-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_cadence_rules')
        .select('*')
        .eq('is_active', true)
        .order('relationship_stage')
        .limit(1000);
      if (error) throw error;
      return data;
    }
  });

  const saveRule = useMutation({
    mutationFn: async (ruleData: CadenceRule) => {
      const payload = {
        ...ruleData,
        cadence_steps: ruleData.cadence_steps.map(({ _localId: _, ...step }) => step),
      };
      if (payload.id) {
        const { error } = await supabase
          .from('crm_cadence_rules')
          .update(payload as TablesUpdate<'crm_cadence_rules'>)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crm_cadence_rules')
          .insert([payload as TablesInsert<'crm_cadence_rules'>]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-cadence-rules'] });
      toast.success('Regra de cadência salva com sucesso');
      setIsDialogOpen(false);
      setEditingRule(null);
    },
    onError: (error: Error) => toast.error(`Erro ao salvar regra: ${error.message}`)
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_cadence_rules').update({ is_active: false }).eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-cadence-rules'] });
      toast.success('Regra removida');
    },
    onError: (e: Error) => toast.error(`Erro ao remover regra: ${e.message}`),
  });

  const handleOpenDialog = (rule?: { id?: string; relationship_stage?: string; frequency_days?: number; priority?: string; cadence_steps?: unknown }) => {
    if (rule) {
      setEditingRule({
        id: rule.id,
        relationship_stage: rule.relationship_stage ?? 'prospect',
        frequency_days: rule.frequency_days ?? 7,
        priority: (rule.priority as CadencePriority) ?? 'medium',
        cadence_steps: ((rule.cadence_steps as CadenceStep[] | undefined) ?? []).map(s => ({ ...s, _localId: nextStepId() }))
      });
    } else {
      setEditingRule({
        relationship_stage: 'prospect',
        frequency_days: 7,
        priority: 'medium',
        cadence_steps: [
          { _localId: nextStepId(), type: 'message', delay_days: 0, content: 'Primeiro contato de acompanhamento' }
        ]
      });
    }
    setIsDialogOpen(true);
  };

  // Sincronização automática para novas regras ou mudanças de estágio
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`cadence-updates:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_cadence_rules', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-cadence-rules'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  const handleAddStep = () => {
    if (!editingRule) return;
    const steps = [...(editingRule.cadence_steps || [])];
    steps.push({ _localId: nextStepId(), type: 'message', delay_days: 2, content: 'Próximo passo da cadência' });
    setEditingRule({ ...editingRule, cadence_steps: steps });
  };

  const handleUpdateStep = <K extends keyof CadenceStep>(index: number, field: K, value: CadenceStep[K]) => {
    if (!editingRule) return;
    const steps = [...(editingRule.cadence_steps || [])];
    steps[index] = { ...steps[index], [field]: value };
    setEditingRule({ ...editingRule, cadence_steps: steps });
  };

  const handleRemoveStep = (index: number) => {
    if (!editingRule) return;
    const steps = [...(editingRule.cadence_steps || [])];
    steps.splice(index, 1);
    setEditingRule({ ...editingRule, cadence_steps: steps });
  };

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Regras de Cadência por Estágio
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8 text-[10px] uppercase font-bold" onClick={() => handleOpenDialog()}>
            <Plus className="h-3 w-3 mr-1" /> Nova Regra
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase">Estágio</TableHead>
                <TableHead className="text-[10px] uppercase text-center">Frequência</TableHead>
                <TableHead className="text-[10px] uppercase text-center">Passos</TableHead>
                <TableHead className="text-[10px] uppercase text-center">Prioridade</TableHead>
                <TableHead className="text-[10px] uppercase text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-xs font-semibold">
                    {RELATIONSHIP_STAGE_LABELS[rule.relationship_stage as keyof typeof RELATIONSHIP_STAGE_LABELS] || rule.relationship_stage}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    Cada {rule.frequency_days} dias
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-[9px]">
                      {Array.isArray(rule.cadence_steps) ? rule.cadence_steps.length : 0} passos
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {rule.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" aria-label="Configurações" 
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => handleOpenDialog(rule)}
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </B<Button 
                      variant="ghost" 
                      size="icon" aria-label="Remover" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRule.mutate(rule.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>                  </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rules?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground italic">
                    Nenhuma regra personalizada configurada. O sistema está usando os padrões globais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-primary/80">
              <strong>Versionamento:</strong> Todas as alterações nas regras de cadência são registradas para auditoria. Contatos que já estão em cadência podem ser migrados para a nova versão automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Configurar Regra de Cadência</DialogTitle>
            <DialogDescription>
              Defina a frequência e os passos de acompanhamento para o estágio selecionado.
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 p-6 pt-2">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Estágio do Funil</Label>
                      <Select 
                        value={editingRule.relationship_stage} 
                        onValueChange={(val) => setEditingRule({...editingRule!, relationship_stage: val})}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(RELATIONSHIP_STAGE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Prioridade da Fila</Label>
                      <Select 
                        value={editingRule.priority} 
                        onValueChange={(val) => setEditingRule({...editingRule!, priority: val as CadencePriority})}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Frequência (Dias)</Label>
                      <Input 
                        type="number" 
                        value={editingRule.frequency_days} 
                        onChange={(e) => setEditingRule({...editingRule!, frequency_days: parseInt(e.target.value) || 1})}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Passos da Sequência
                      </h4>
                      <Button type="button" size="sm" variant="ghost" className="h-8 text-xs text-primary" onClick={handleAddStep}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar Passo
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {editingRule.cadence_steps?.map((step: CadenceStep, index: number) => (
                        <div key={step._localId ?? index} className="group relative bg-muted/30 rounded-lg p-3 border border-dashed hover:border-primary/3<Button 
                            variant="ghost" 
                            size="icon" aria-label="Remover" 
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveStep(index)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>tructive" />
                          </Button>
                          
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3 space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</Label>
                              <Select 
                                value={step.type} 
                                onValueChange={(val) => handleUpdateStep(index, 'type', val as CadenceStepType)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="message">Mensagem</SelectItem>
                                  <SelectItem value="call">Ligação</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="task">Tarefa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Aguardar</Label>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  value={step.delay_days} 
                                  onChange={(e) => handleUpdateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                                  className="h-8 text-xs pr-6"
                                />
                                <span className="absolute right-2 top-1.5 text-[9px] text-muted-foreground">d</span>
                              </div>
                            </div>
                            <div className="col-span-7 space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Conteúdo Sugerido / Ação</Label>
                              <Input 
                                value={step.content} 
                                onChange={(e) => handleUpdateStep(index, 'content', e.target.value)}
                                className="h-8 text-xs"
                                placeholder="Ex: Mensagem sobre nova feature..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!editingRule.cadence_steps || editingRule.cadence_steps.length === 0) && (
                        <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
                          <p className="text-xs text-muted-foreground italic">Nenhum passo configurado nesta cadência.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              <DialogFooter className="p-6 border-t bg-muted/10">
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button size="sm" onClick={() => saveRule.mutate(editingRule)} disabled={saveRule.isPending}>
                  {editingRule.id ? 'Atualizar Regra' : 'Criar Regra'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
