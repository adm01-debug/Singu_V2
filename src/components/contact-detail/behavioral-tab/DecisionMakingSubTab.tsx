import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Zap, ListCheck, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function DecisionMakingSubTab({ contactId }: Props) {
  const { decision, updateDecision, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (decision) setFormData(decision);
  }, [decision]);

  if (isLoading) return <div>Carregando...</div>;

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
            <Label>Velocidade de Decisão</Label>
            <Input 
              value={formData.decision_speed || ""} 
              onChange={(e) => setFormData({ ...formData, decision_speed: e.target.value })}
              placeholder="Ex: Rápida, Analítica..."
            />
          </div>
          <div className="space-y-2">
            <Label>Autoridade de Orçamento</Label>
            <Input 
              value={formData.budget_authority || ""} 
              onChange={(e) => setFormData({ ...formData, budget_authority: e.target.value })}
              placeholder="Ex: Integral, Parcial..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="needs-approval-dec" 
              checked={formData.needs_approval} 
              onCheckedChange={(val) => setFormData({ ...formData, needs_approval: !!val })}
            />
            <Label htmlFor="needs-approval-dec">Necessita Aprovação Superior</Label>
          </div>
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
            <Label>Critérios (Vem separados por vírgula)</Label>
            <Input 
              value={formData.decision_criteria?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, decision_criteria: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Ex: ROI, Preço, Suporte..."
            />
          </div>
          <Button className="w-full gap-2 mt-4" onClick={() => updateDecision(formData)}>
            <Save className="h-4 w-4" />
            Salvar Critérios
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
