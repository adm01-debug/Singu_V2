import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useContactBehavior, ContactBehavior } from "@/hooks/useContactBehavior";

interface DISCSubTabProps {
  contactId: string;
  data?: ContactBehavior;
}

export const DISCSubTab = ({ contactId, data }: DISCSubTabProps) => {
  const { updateBehavior } = useContactBehavior(contactId);
  const [formData, setFormData] = React.useState<ContactBehavior>(data || {});

  const handleSave = () => {
    updateBehavior(formData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil DISC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Perfil Primário</Label>
            <Select 
              value={formData.disc_primary} 
              onValueChange={(val: any) => setFormData({ ...formData, disc_primary: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="D">Dominância (D)</SelectItem>
                <SelectItem value="I">Influência (I)</SelectItem>
                <SelectItem value="S">Estabilidade (S)</SelectItem>
                <SelectItem value="C">Conformidade (C)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Confiança no Perfil ({formData.disc_confidence || 0}%)</Label>
            <Slider 
              value={[formData.disc_confidence || 0]} 
              min={0} max={100} step={1}
              onValueChange={(val) => setFormData({ ...formData, disc_confidence: val[0] })}
            />
          </div>
          <div className="space-y-2">
            <Label>Notas DISC</Label>
            <Textarea 
              value={formData.disc_notes || ""} 
              onChange={(e) => setFormData({ ...formData, disc_notes: e.target.value })}
              placeholder="Ex: Demonstra alta dominância em negociações, mas é cauteloso com dados..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canal VAK</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Canal Primário</Label>
            <Select 
              value={formData.vak_primary} 
              onValueChange={(val: any) => setFormData({ ...formData, vak_primary: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visual">Visual</SelectItem>
                <SelectItem value="auditivo">Auditivo</SelectItem>
                <SelectItem value="cinestesico">Cinestésico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
            {formData.vak_primary === 'visual' && "Prefere gráficos, apresentações visuais e e-mails estruturados."}
            {formData.vak_primary === 'auditivo' && "Prefere chamadas de áudio, discussões verbais e clareza no tom de voz."}
            {formData.vak_primary === 'cinestesico' && "Valoriza o 'toque', demonstrações práticas e a sensação de confiança."}
          </div>
          <Button className="w-full mt-4" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar VAK
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
