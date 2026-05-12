import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useContactBehavior, ContactDecisionMaking } from "@/hooks/useContactBehavior";

interface DecisionMakingSubTabProps {
  contactId: string;
  data?: ContactDecisionMaking;
}

export const DecisionMakingSubTab = ({ contactId, data }: DecisionMakingSubTabProps) => {
  const { updateDecision } = useContactBehavior(contactId);
  const [formData, setFormData] = React.useState<ContactDecisionMaking>(data || {});

  const handleSave = () => updateDecision(formData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tomada de Decisão</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Velocidade de Decisão</Label>
            <Input 
              value={formData.decision_speed || ""} 
              onChange={(e) => setFormData({ ...formData, decision_speed: e.target.value })}
              placeholder="Ex: Rápida, Analítica, Lenta..."
            />
          </div>
          <div className="space-y-2">
            <Label>Autoridade de Orçamento</Label>
            <Input 
              value={formData.budget_authority || ""} 
              onChange={(e) => setFormData({ ...formData, budget_authority: e.target.value })}
              placeholder="Ex: Integral, Parcial, Sem Autoridade..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="needs-approval" 
              checked={formData.needs_approval} 
              onCheckedChange={(val) => setFormData({ ...formData, needs_approval: !!val })}
            />
            <Label htmlFor="needs-approval">Necessita Aprovação Superior</Label>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Critérios de Decisão (Separados por vírgula)</Label>
            <Input 
              value={formData.decision_criteria?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, decision_criteria: e.target.value.split(",").map(i => i.trim()) })}
              placeholder="Ex: Preço, ROI, Prazo..."
            />
          </div>
          <div className="space-y-2">
            <Label>ID do Aprovador (UUID)</Label>
            <Input 
              value={formData.approver_id || ""} 
              onChange={(e) => setFormData({ ...formData, approver_id: e.target.value })}
              placeholder="Cole o ID do contato aprovador"
            />
          </div>
           <Button className="w-full" onClick={handleSave} variant="outline">
             <Save className="h-4 w-4 mr-2" />
             Salvar Critérios de Decisão
           </Button>
        </div>
      </CardContent>
    </Card>
  );
};
