import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useContactBehavior, ContactBehavior } from "@/hooks/useContactBehavior";

interface MotivationsSubTabProps {
  contactId: string;
  data?: ContactBehavior;
}

export const MotivationsSubTab = ({ contactId, data }: MotivationsSubTabProps) => {
  const { updateBehavior } = useContactBehavior(contactId);
  const [formData, setFormData] = React.useState<ContactBehavior>(data || {});

  const handleSave = () => updateBehavior(formData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metaprogramas (Motivação)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Motivação Principal</Label>
            <Input 
              value={formData.motivation_primary || ""} 
              onChange={(e) => setFormData({ ...formData, motivation_primary: e.target.value })}
              placeholder="Ex: Reconhecimento, Crescimento, Segurança..."
            />
          </div>
          <div className="space-y-2">
            <Label>Medo Principal</Label>
            <Input 
              value={formData.main_fear || ""} 
              onChange={(e) => setFormData({ ...formData, main_fear: e.target.value })}
              placeholder="Ex: Falha pública, Perda de controle..."
            />
          </div>
          <div className="space-y-2">
            <Label>Estágio de Carreira</Label>
            <Input 
              value={formData.career_stage || ""} 
              onChange={(e) => setFormData({ ...formData, career_stage: e.target.value })}
              placeholder="Ex: Ascensão meteórica, Consolidação..."
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pressão Atual</Label>
            <Textarea 
              value={formData.current_pressure || ""} 
              onChange={(e) => setFormData({ ...formData, current_pressure: e.target.value })}
              placeholder="Quais desafios este contato está enfrentando hoje?"
            />
          </div>
          <div className="space-y-2">
            <Label>Objetivos Profissionais</Label>
            <Textarea 
              value={formData.professional_goals || ""} 
              onChange={(e) => setFormData({ ...formData, professional_goals: e.target.value })}
              placeholder="Onde ele quer chegar no próximo ano?"
            />
          </div>
           <Button className="w-full mt-auto" onClick={handleSave} variant="outline">
             <Save className="h-4 w-4 mr-2" />
             Salvar Motivações
           </Button>
        </div>
      </CardContent>
    </Card>
  );
};
