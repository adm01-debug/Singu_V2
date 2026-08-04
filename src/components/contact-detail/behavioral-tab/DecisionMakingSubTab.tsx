import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, ListCheck, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import type { ContactDecisionMaking } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function DecisionMakingSubTab({ contactId }: Props) {
  const { decision, updateDecision, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<Partial<ContactDecisionMaking>>({});

  useEffect(() => {
    if (decision) setFormData(decision);
  }, [decision]);

  if (isLoading) return <div className="p-4 text-center">Carregando processo de decisão...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Processo de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Velocidade de Decisão</Label>
            <Input 
              value={formData.decision_speed || ""} 
              onChange={(e) => setFormData({ ...formData, decision_speed: e.target.value })}
              placeholder="Ex: Rápida, Analítica..."
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="budget-authority" 
              checked={!!formData.budget_authority}
              onCheckedChange={(val) => setFormData({ ...formData, budget_authority: val ? 'yes' : '' })}
            />
            <Label htmlFor="budget-authority" className="text-xs font-medium">Possui Autoridade de Orçamento</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="needs-approval-dec" 
              checked={formData.needs_approval} 
              onCheckedChange={(val) => setFormData({ ...formData, needs_approval: !!val })}
            />
            <Label htmlFor="needs-approval-dec" className="text-xs font-medium">Necessita Aprovação Superior</Label>
          </div>
          {formData.needs_approval && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs italic text-muted-foreground">ID do Aprovador (opcional)</Label>
              <Input 
                value={formData.approver_id || ""} 
                onChange={(e) => setFormData({ ...formData, approver_id: e.target.value })}
                placeholder="UUID do aprovador..."
                className="h-7 text-[10px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <ListCheck className="h-4 w-4 text-primary" />
            Critérios & Salvar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Critérios (separados por vírgula)</Label>
            <Input 
              value={formData.decision_criteria?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, decision_criteria: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Ex: ROI, Preço, Suporte..."
              className="h-8 text-xs"
            />
          </div>
          <Button className="w-full gap-2 mt-4 h-9 text-xs" onClick={() => updateDecision(formData)}>
            <Save className="h-4 w-4" />
            Salvar Critérios
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
