import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ShieldAlert, Briefcase, Zap, Goal, Save } from 'lucide-react';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function MotivationsSubTab({ contactId }: Props) {
  const { behavior, updateBehavior, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (behavior) {
      setFormData(behavior);
    }
  }, [behavior]);

  if (isLoading) return <div className="p-4 text-center">Carregando...</div>;

  const handleSave = () => {
    updateBehavior(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Motivação & Medos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Motivação Principal</Label>
              <Input 
                value={formData.motivation_primary || ""} 
                onChange={(e) => setFormData({ ...formData, motivation_primary: e.target.value })}
                placeholder="Ex: Reconhecimento, Crescimento..."
              />
            </div>
            <div className="space-y-2">
              <Label>Medo Principal</Label>
              <Input 
                value={formData.main_fear || ""} 
                onChange={(e) => setFormData({ ...formData, main_fear: e.target.value })}
                placeholder="Ex: Falha pública, Perda de autonomia..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              Carreira & Pressão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Estágio de Carreira</Label>
              <Input 
                value={formData.career_stage || ""} 
                onChange={(e) => setFormData({ ...formData, career_stage: e.target.value })}
                placeholder="Ex: Consolidação, Transição..."
              />
            </div>
            <div className="space-y-2">
              <Label>Pressão Atual</Label>
              <Textarea 
                value={formData.current_pressure || ""} 
                onChange={(e) => setFormData({ ...formData, current_pressure: e.target.value })}
                placeholder="Descreva as pressões externas ou internas..."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <Goal className="h-4 w-4 text-success" />
            Objetivos Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            value={formData.professional_goals || ""} 
            onChange={(e) => setFormData({ ...formData, professional_goals: e.target.value })}
            placeholder="Quais os objetivos de longo prazo deste contato?"
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Motivações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
