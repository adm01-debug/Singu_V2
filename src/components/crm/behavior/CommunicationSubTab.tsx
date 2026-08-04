import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save, Clock } from "lucide-react";
import { useContactBehavior, ContactBehavior } from "@/hooks/useContactBehavior";

interface CommunicationSubTabProps {
  contactId: string;
  data?: ContactBehavior;
}

export const CommunicationSubTab = ({ contactId, data }: CommunicationSubTabProps) => {
  const { updateBehavior } = useContactBehavior(contactId);
  const [formData, setFormData] = React.useState<ContactBehavior>(data || {});

  const handleSave = () => updateBehavior(formData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comunicação e Estilo</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Canal Preferido</Label>
            <Select 
              value={formData.preferred_channel} 
              onValueChange={(val) => setFormData({ ...formData, preferred_channel: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="call">Chamada Telefônica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estilo de Mensagem</Label>
            <Input 
              value={formData.message_style || ""} 
              onChange={(e) => setFormData({ ...formData, message_style: e.target.value })}
              placeholder="Ex: Direto, Formal, Descontraído..."
            />
          </div>
          <div className="space-y-2">
            <Label>Nível de Formalidade (1-5)</Label>
            <Slider 
              value={[formData.formality_level || 3]} 
              min={1} max={5} step={1}
              onValueChange={(val) => setFormData({ ...formData, formality_level: val[0] })}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Janela de Contato Ideal</Label>
            <Input 
              value={formData.best_contact_window || ""} 
              onChange={(e) => setFormData({ ...formData, best_contact_window: e.target.value })}
              placeholder="Ex: Manhãs entre 08:00 e 10:00"
            />
          </div>
          <div className="space-y-2">
            <Label>Tempo de Resposta (Média)</Label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input 
                value={formData.response_time_avg || ""} 
                onChange={(e) => setFormData({ ...formData, response_time_avg: e.target.value })}
                placeholder="Ex: 2 horas"
              />
            </div>
          </div>
           <Button className="w-full mt-4" onClick={handleSave} variant="outline">
             <Save className="h-4 w-4 mr-2" />
             Salvar Comunicação
           </Button>
        </div>
      </CardContent>
    </Card>
  );
};
