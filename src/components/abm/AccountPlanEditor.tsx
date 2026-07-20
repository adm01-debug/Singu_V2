import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { useABMAccountPlans, useUpsertAccountPlan, type ABMAccountPlan } from "@/hooks/useABM";

export function AccountPlanEditor({ accountId }: { accountId: string }) {
  const { data: plans = [] } = useABMAccountPlans(accountId);
  const upsert = useUpsertAccountPlan();
  const [plan, setPlan] = useState<Partial<ABMAccountPlan>>({
    template_type: "strategic",
    objectives: [],
    strategies: [],
    key_stakeholders: [],
    milestones: [],
    status: "draft",
  });

  useEffect(() => {
    if (plans.length > 0) setPlan(plans[0]);
  }, [plans]);

  const addObjective = () =>
    setPlan({ ...plan, objectives: [...(plan.objectives ?? []), { title: "", completed: false }] });
  const updObjective = (i: number, patch: Partial<{ title: string; completed: boolean }>) => {
    const next = [...(plan.objectives ?? [])];
    next[i] = { ...next[i], ...patch };
    setPlan({ ...plan, objectives: next });
  };
  const removeObjective = (i: number) =>
    setPlan({ ...plan, objectives: (plan.objectives ?? []).filter((_, idx) => idx !== i) });

  const addStrategy = () => setPlan({ ...plan, strategies: [...(plan.strategies ?? []), ""] });
  const updStrategy = (i: number, v: string) => {
    const next = [...(plan.strategies ?? [])];
    next[i] = v;
    setPlan({ ...plan, strategies: next });
  };
  const removeStrategy = (i: number) =>
    setPlan({ ...plan, strategies: (plan.strategies ?? []).filter((_, idx) => idx !== i) });

  const addMilestone = () =>
    setPlan({ ...plan, milestones: [...(plan.milestones ?? []), { title: "", date: "", done: false }] });
  const updMilestone = (i: number, patch: Partial<{ title: string; date: string; done: boolean }>) => {
    const next = [...(plan.milestones ?? [])];
    next[i] = { ...next[i], ...patch };
    setPlan({ ...plan, milestones: next });
  };
  const removeMilestone = (i: number) =>
    setPlan({ ...plan, milestones: (plan.milestones ?? []).filter((_, idx) => idx !== i) });

  const onSave = () => upsert.mutate({ ...plan, account_id: accountId });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Plano Estratégico de Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Template</Label>
              <Select
                value={plan.template_type ?? "strategic"}
                onValueChange={(v) => setPlan({ ...plan, template_type: v as ABMAccountPlan["template_type"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategic">Estratégico</SelectItem>
                  <SelectItem value="growth">Crescimento</SelectItem>
                  <SelectItem value="retention">Retenção</SelectItem>
                  <SelectItem value="penetration">Penetração</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={plan.status ?? "draft"}
                onValueChange={(v) => setPlan({ ...plan, status: v as ABMAccountPlan["status"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Objetivo principal</Label>
            <Textarea
              value={plan.goal ?? ""}
              onChange={(e) => setPlan({ ...plan, goal: e.target.value })}
              rows={2}
              placeholder="Ex: Tornar-se fornecedor preferencial em 12 meses"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Receita-alvo (R$)</Label>
              <Input
                type="number"
                value={plan.target_revenue ?? ""}
                onChange={(e) => setPlan({ ...plan, target_revenue: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div>
              <Label>Início</Label>
              <Input
                type="date"
                value={plan.start_date ?? ""}
                onChange={(e) => setPlan({ ...plan, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Término</Label>
              <Input
                type="date"
                value={plan.end_date ?? ""}
                onChange={(e) => setPlan({ ...plan, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Objetivos</Label>
              <Button size="sm" variant="ghost" onClick={addObjective}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
            </div>
            <div className="space-y-2">
              {(plan.objectives ?? []).map((obj, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox checked={obj.completed} onCheckedChange={(c) => updObjective(i, { completed: !!c })} />
                  <Input
                    value={obj.title}
                    onChange={(e) => updObjective(i, { title: e.target.value })}
                    placeholder="Descreva o objetivo"
                  />
                  <Button size="icon" aria-label="Remover" variant="ghost" onClick={() => removeObjective(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Estratégias</Label>
              <Button size="sm" variant="ghost" onClick={addStrategy}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
            </div>
            <div className="space-y-2">
              {(plan.strategies ?? []).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={s} onChange={(e) => updStrategy(i, e.target.value)} placeholder="Estratégia" <Button size="icon" aria-label="Remover" variant="ghost" onClick={() => removeStrategy(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>            </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Milestones</Label>
              <Button size="sm" variant="ghost" onClick={addMilestone}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
            </div>
            <div className="space-y-2">
              {(plan.milestones ?? []).map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox checked={m.done} onCheckedChange={(c) => updMilestone(i, { done: !!c })} />
                  <Input
                    className="flex-1"
                    value={m.title}
                    onChange={(e) => updMilestone(i, { title: e.target.value })}
                    placeholder="Milestone"
                  />
                  <Input
                    type="date"
                    className="w-40"
                    value={m.date ?? ""}
                    onChange={(e) => updMilestone(i, { date: e.target.value }<Button size="icon" aria-label="Remover" variant="ghost" onClick={() => removeMilestone(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>e="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={onSave} disabled={upsert.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {upsert.isPending ? "Salvando..." : "Salvar plano"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
