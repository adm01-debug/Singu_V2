import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Zap, AlertTriangle, MapPin, Award, Info } from 'lucide-react';
import {
  useRoutingRules, useCreateRoutingRule,
  useUpdateRoutingRule, useDeleteRoutingRule,
} from '@/hooks/useLeadRouting';
import { RULE_TYPE_LABELS } from '@/types/leadRouting';
import type { LeadRoutingRule, RoutingRuleType } from '@/types/leadRouting';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RULE_DESCRIPTIONS: Record<RoutingRuleType, string> = {
  round_robin: 'Distribui leads igualmente, alternando entre os vendedores na ordem.',
  weighted: 'Distribui mais leads para vendedores com peso maior.',
  territory: 'Direciona leads baseado na região/território do lead.',
  specialization: 'Direciona leads baseado na especialização do vendedor.',
  load_balanced: 'Equilibra a carga atual entre os vendedores ativos.',
};

function RuleForm({
  initial,
  onSave,
  isPending,
}: {
  initial?: Partial<LeadRoutingRule>;
  onSave: (data: Partial<LeadRoutingRule>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [ruleType, setRuleType] = useState<RoutingRuleType>(initial?.rule_type ?? 'round_robin');
  const [roleFilter, setRoleFilter] = useState<'sdr' | 'closer' | 'any'>(initial?.role_filter ?? 'any');
  const [priority, setPriority] = useState(initial?.priority ?? 1);
  const [territories, setTerritories] = useState(
    (initial?.conditions as Record<string, unknown>)?.territories
      ? ((initial?.conditions as Record<string, unknown>)?.territories as string[]).join(', ')
      : ''
  );
  const [specializations, setSpecializations] = useState(
    (initial?.conditions as Record<string, unknown>)?.specializations
      ? ((initial?.conditions as Record<string, unknown>)?.specializations as string[]).join(', ')
      : ''
  );
  const [minScore, setMinScore] = useState(
    ((initial?.conditions as Record<string, unknown>)?.min_relationship_score as number) ?? 0
  );

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;

    const conditions: Record<string, unknown> = {};
    if (territories.trim()) {
      conditions.territories = territories.split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (specializations.trim()) {
      conditions.specializations = specializations.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (minScore > 0) {
      conditions.min_relationship_score = minScore;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      rule_type: ruleType,
      role_filter: roleFilter,
      priority,
      conditions,
    });
  }, [name, description, ruleType, roleFilter, priority, territories, specializations, minScore, onSave]);

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-1.5">
        <Label>Nome da Regra *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Distribuição SDR Brasil" />
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva quando esta regra deve ser aplicada..." rows={2} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1">
            Tipo
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{RULE_DESCRIPTIONS[ruleType]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select value={ruleType} onValueChange={(v) => setRuleType(v as RoutingRuleType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Papel Alvo</Label>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'sdr' | 'closer' | 'any')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer</SelectItem>
              <SelectItem value="sdr">SDR</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Input type="number" min={1} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">Menor = executa primeiro</p>
        </div>
      </div>

      {/* Conditional fields */}
      {(ruleType === 'territory' || ruleType === 'specialization' || ruleType === 'weighted') && (
        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Condições</p>
          {(ruleType === 'territory') && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Territórios
              </Label>
              <Input
                value={territories}
                onChange={(e) => setTerritories(e.target.value)}
                placeholder="SP, RJ, MG (separados por vírgula)"
              />
              <p className="text-xs text-muted-foreground">Leads dessas regiões usarão esta regra</p>
            </div>
          )}
          {(ruleType === 'specialization') && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Award className="h-3 w-3" /> Especializações
              </Label>
              <Input
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
                placeholder="SaaS, E-commerce, Fintech (separados por vírgula)"
              />
              <p className="text-xs text-muted-foreground">Leads desses segmentos usarão esta regra</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Score Mínimo de Relacionamento</Label>
            <Input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="h-8" />
            <p className="text-xs text-muted-foreground">0 = sem filtro de score</p>
          </div>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!name.trim() || isPending} className="w-full">
        {initial?.id ? 'Atualizar Regra' : 'Criar Regra'}
      </Button>
    </div>
  );
}

function RuleTypeIcon({ type }: { type: RoutingRuleType }) {
  const colors: Record<RoutingRuleType, string> = {
    round_robin: 'bg-primary/10 text-primary',
    weighted: 'bg-info/10 text-info',
    territory: 'bg-success/10 text-success',
    specialization: 'bg-warning/10 text-warning',
    load_balanced: 'bg-accent/10 text-accent-foreground',
  };
  return (
    <div className={`p-1.5 rounded-md ${colors[type]}`}>
      <Zap className="h-3.5 w-3.5" />
    </div>
  );
}

export default function RoutingRulesTab() {
  const { data: rules = [], isLoading } = useRoutingRules();
  const createRule = useCreateRoutingRule();
  const updateRule = useUpdateRoutingRule();
  const deleteRule = useDeleteRoutingRule();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  const ruleToDelete = deleteId ? rules.find((r) => r.id === deleteId) : null;
  const activeCount = rules.filter((r) => r.is_active).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {rules.length} regra{rules.length !== 1 ? 's' : ''}
          </p>
          <Badge variant="outline" className="text-xs">{activeCount} ativa{activeCount !== 1 ? 's' : ''}</Badge>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Regra de Distribuição</DialogTitle></DialogHeader>
            <RuleForm
              onSave={(data) => { createRule.mutate(data); setShowForm(false); }}
              isPending={createRule.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {rules.map((r) => {
          const conditions = r.conditions as Record<string, unknown> | undefined;
          const hasTerritories = Array.isArray(conditions?.territories) && (conditions.territories as string[]).length > 0;
          const hasSpecs = Array.isArray(conditions?.specializations) && (conditions.specializations as string[]).length > 0;

          return (
            <Card key={r.id} className={`border ${!r.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <RuleTypeIcon type={r.rule_type} />
                    <Badge variant="outline" className="text-xs shrink-0">#{r.priority}</Badge>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{r.name}</span>
                        <Badge variant="secondary">{RULE_TYPE_LABELS[r.rule_type]}</Badge>
                        {r.role_filter !== 'any' && (
                          <Badge variant="outline">{r.role_filter.toUpperCase()}</Badge>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{r.description}</p>
                      )}
                      {(hasTerritories || hasSpecs) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {hasTerritories && (conditions.territories as string[]).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                              <MapPin className="h-2.5 w-2.5 mr-0.5" />{t}
                            </Badge>
                          ))}
                          {hasSpecs && (conditions.specializations as string[]).map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
                              <Award className="h-2.5 w-2.5 mr-0.5" />{s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={r.is_active}
                      onCheckedChange={(v) => updateRule.mutate({ id: r.id, is_active: v })}
                      aria-label={`${r.is_active ? 'Desativar' : 'Ativar'} regra ${r.name}`}
                    />
                    <Dialog open={editingId === r.id} onOpenChange={(o) => setEditingId(o ? r.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Editar Regra</DialogTitle></DialogHeader>
                        <RuleForm
                          initial={r}
                          onSave={(data) => { updateRule.mutate({ id: r.id, ...data }); setEditingId(null); }}
                          isPending={updateRule.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {rules.length === 0 && (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhuma regra configurada</p>
              <p className="text-xs mt-1">Crie regras para automatizar a distribuição de leads entre SDRs e Closers.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover a regra <strong>{ruleToDelete?.name}</strong>?
            Novas distribuições não usarão mais esta regra.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteId) { deleteRule.mutate(deleteId); setDeleteId(null); } }}
              disabled={deleteRule.isPending}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
