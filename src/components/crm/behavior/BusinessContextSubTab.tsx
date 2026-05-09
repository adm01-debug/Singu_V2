import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useContactBehavior, ContactBusinessContext } from "@/hooks/useContactBehavior";

interface BusinessContextSubTabProps {
  contactId: string;
  data?: ContactBusinessContext;
}

export const BusinessContextSubTab = ({ contactId, data }: BusinessContextSubTabProps) => {
  const { updateBusiness } = useContactBehavior(contactId);
  const [formData, setFormData] = React.useState<ContactBusinessContext>(data || {});

  const handleSave = () => updateBusiness(formData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contexto Empresarial</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Saúde Financeira da Empresa</Label>
            <Input 
              value={formData.financial_health || ""} 
              onChange={(e) => setFormData({ ...formData, financial_health: e.target.value })}
              placeholder="Ex: Em crescimento, Estável, Crise..."
            />
          </div>
          <div className="space-y-2">
            <Label>Desafios Atuais (Separados por vírgula)</Label>
            <Textarea 
              value={formData.current_challenges?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, current_challenges: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Ex: Falta de budget, Mudança de gestão..."
            />
          </div>
          <div className="space-y-2">
            <Label>Melhor Momento para Abordar</Label>
            <Input 
              value={formData.best_moment_to_approach || ""} 
              onChange={(e) => setFormData({ ...formData, best_moment_to_approach: e.target.value })}
              placeholder="Ex: Após fechamento de trimestre"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Concorrentes Utilizados (Separados por vírgula)</Label>
            <Textarea 
              value={formData.competitors_used?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, competitors_used: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Ex: Salesforce, HubSpot..."
            />
          </div>
          <div className="space-y-2">
            <Label>Notas Sazonais</Label>
            <Textarea 
              value={formData.seasonal_notes || ""} 
              onChange={(e) => setFormData({ ...formData, seasonal_notes: e.target.value })}
              placeholder="Ex: Férias em Janeiro, Budget renova em Março..."
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Contexto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
