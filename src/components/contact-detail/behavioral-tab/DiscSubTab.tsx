import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, History, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function DiscSubTab({ contactId }: Props) {
  const { behavior, updateBehavior, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (behavior) setFormData(behavior);
  }, [behavior]);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Perfil DISC Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Perfil Primário</Label>
            <Select 
              value={formData.disc_primary} 
              onValueChange={(val) => setFormData({ ...formData, disc_primary: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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
            <Label>Confiança ({formData.disc_confidence || 0}%)</Label>
            <Slider 
              value={[formData.disc_confidence || 0]} 
              max={100} step={1}
              onValueChange={(val) => setFormData({ ...formData, disc_confidence: val[0] })}
            />
          </div>
          <div className="space-y-2">
            <Label>Notas do Perfil</Label>
            <Textarea 
              value={formData.disc_notes || ""} 
              onChange={(e) => setFormData({ ...formData, disc_notes: e.target.value })}
              placeholder="Observações sobre o comportamento..."
            />
          </div>
          <Button className="w-full gap-2" onClick={() => updateBehavior(formData)}>
            <Save className="h-4 w-4" />
            Salvar DISC
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Dicas DISC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg text-xs space-y-2">
            {formData.disc_primary === 'D' && <p><strong>Dominância:</strong> Seja direto, foque em resultados e economize tempo.</p>}
            {formData.disc_primary === 'I' && <p><strong>Influência:</strong> Seja amigável, entusiasta e foque no relacionamento.</p>}
            {formData.disc_primary === 'S' && <p><strong>Estabilidade:</strong> Seja paciente, calmo e foque na segurança e processos.</p>}
            {formData.disc_primary === 'C' && <p><strong>Conformidade:</strong> Seja preciso, use dados e foque na qualidade e detalhes.</p>}
            {!formData.disc_primary && <p>Selecione um perfil para ver dicas de abordagem.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
