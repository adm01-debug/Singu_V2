import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import type { ContactBehavior } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function InfluencersSubTab({ contactId }: Props) {
  const { influence, updateInfluence, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<Partial<ContactBehavior>>({});

  useEffect(() => {
    if (influence) setFormData(influence);
  }, [influence]);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <Crown className="h-4 w-4 text-warning" />
            Poder de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Papel no Processo</Label>
            <Input 
              value={formData.decision_role || ""} 
              onChange={(e) => setFormData({ ...formData, decision_role: e.target.value })}
              placeholder="Ex: Decisor Econômico, Champion..."
            />
          </div>
          <div className="space-y-2">
            <Label>Poder de Decisão ({formData.decision_power || 0}/10)</Label>
            <Slider 
              value={[formData.decision_power || 5]} 
              min={1} max={10} step={1}
              onValueChange={(val) => setFormData({ ...formData, decision_power: val[0] })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nível de Suporte ({formData.support_level || 0}/10)</Label>
            <Slider 
              value={[formData.support_level || 5]} 
              min={1} max={10} step={1}
              onValueChange={(val) => setFormData({ ...formData, support_level: val[0] })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Mapeamento & Salvar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>IDs de Influenciadores (UUIDs)</Label>
            <Textarea 
              value={formData.influencer_ids?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, influencer_ids: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="IDs dos contatos que influenciam este decisor..."
              className="min-h-[100px]"
            />
          </div>
          <Button className="w-full gap-2 mt-4" onClick={() => updateInfluence(formData)}>
            <Save className="h-4 w-4" />
            Salvar Influência
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
