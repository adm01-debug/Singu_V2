import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useContactBehavior, ContactInfluence } from "@/hooks/useContactBehavior";

interface InfluencePowerSubTabProps {
  contactId: string;
  data?: ContactInfluence;
}

export const InfluencePowerSubTab = ({ contactId, data }: InfluencePowerSubTabProps) => {
  const { updateInfluence } = useContactBehavior(contactId);
  const [formData, setFormData] = React.useState<ContactInfluence>(data || {});

  const handleSave = () => updateInfluence(formData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Influência e Poder</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Papel Decisório</Label>
            <Input 
              value={formData.decision_role || ""} 
              onChange={(e) => setFormData({ ...formData, decision_role: e.target.value })}
              placeholder="Ex: Decisor, Influenciador, Usuário..."
            />
          </div>
          <div className="space-y-2">
            <Label>Poder de Decisão (1-10)</Label>
            <Slider 
              value={[formData.decision_power || 5]} 
              min={1} max={10} step={1}
              onValueChange={(val) => setFormData({ ...formData, decision_power: val[0] })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nível de Suporte/Champion (1-10)</Label>
            <Slider 
              value={[formData.support_level || 5]} 
              min={1} max={10} step={1}
              onValueChange={(val) => setFormData({ ...formData, support_level: val[0] })}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>IDs de Influenciadores (Separados por vírgula)</Label>
            <Textarea 
              value={formData.influencer_ids?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, influencer_ids: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Cole os UUIDs dos contatos influenciadores"
            />
          </div>
          <Button className="w-full mt-4" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Influência
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

import { Textarea } from "@/components/ui/textarea";
