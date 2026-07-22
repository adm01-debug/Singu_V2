import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Briefcase, Goal, Save, MessageSquare, UserCheck } from 'lucide-react';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import type { ContactBehavior } from '@/hooks/useContactBehavior';
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
  const [formData, setFormData] = useState<Partial<ContactBehavior>>({});

  useEffect(() => {
    if (behavior) {
      setFormData(behavior);
    }
  }, [behavior]);

  if (isLoading) return <div className="p-4 text-center">Carregando motivações...</div>;

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
              <Label className="text-xs">Motivação Principal</Label>
              <Input 
                value={formData.motivation_primary || ""} 
                onChange={(e) => setFormData({ ...formData, motivation_primary: e.target.value })}
                placeholder="Ex: Reconhecimento, Crescimento..."
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Medo Principal</Label>
              <Input 
                value={formData.main_fear || ""} 
                onChange={(e) => setFormData({ ...formData, main_fear: e.target.value })}
                placeholder="Ex: Falha pública, Perda de autonomia..."
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              Carreira & Pressão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Estágio de Carreira</Label>
              <Input 
                value={formData.career_stage || ""} 
                onChange={(e) => setFormData({ ...formData, career_stage: e.target.value })}
                placeholder="Ex: Consolidação, Transição..."
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Pressão Atual</Label>
              <Textarea 
                value={formData.current_pressure || ""} 
                onChange={(e) => setFormData({ ...formData, current_pressure: e.target.value })}
                placeholder="Pressões externas ou internas..."
                className="min-h-[80px] text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              Comunicação & Estilo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Canal Preferido</Label>
              <Input 
                value={formData.preferred_channel || ""} 
                onChange={(e) => setFormData({ ...formData, preferred_channel: e.target.value })}
                placeholder="WhatsApp, E-mail, Ligação..."
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Melhor Janela de Contato</Label>
              <Input 
                value={formData.best_contact_window || ""} 
                onChange={(e) => setFormData({ ...formData, best_contact_window: e.target.value })}
                placeholder="Ex: Manhãs, Seg-Qua..."
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-orange-500" />
              Formalidade & Resposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Nível de Formalidade ({formData.formality_level || 3}/5)</Label>
              <Input 
                type="number" min="1" max="5"
                value={formData.formality_level || 3} 
                onChange={(e) => setFormData({ ...formData, formality_level: parseInt(e.target.value) || 3 })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Estilo de Mensagem</Label>
              <Input 
                value={formData.message_style || ""} 
                onChange={(e) => setFormData({ ...formData, message_style: e.target.value })}
                placeholder="Ex: Direto, Detalhado, Informal..."
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
            <Goal className="h-4 w-4 text-success" />
            Objetivos Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            value={formData.professional_goals || ""} 
            onChange={(e) => setFormData({ ...formData, professional_goals: e.target.value })}
            placeholder="Objetivos de longo prazo deste contato..."
            className="min-h-[80px] text-xs"
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2 h-9 text-xs">
              <Save className="h-4 w-4" />
              Salvar Motivações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
