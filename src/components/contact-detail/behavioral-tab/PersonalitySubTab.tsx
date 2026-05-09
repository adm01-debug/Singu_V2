import { Shield, Brain, Star, Activity, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function PersonalitySubTab({ contactId }: Props) {
  const { personality, updatePersonality, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (personality) setFormData(personality);
  }, [personality]);

  if (isLoading) return <div className="p-8 text-center">Carregando frameworks...</div>;

  const handleSave = () => updatePersonality(formData);

  const bigFiveFields = [
    { key: 'big_five_openness', label: 'Abertura (Openness)' },
    { key: 'big_five_conscientiousness', label: 'Conscienciosidade' },
    { key: 'big_five_extraversion', label: 'Extroversão' },
    { key: 'big_five_agreeableness', label: 'Amabilidade' },
    { key: 'big_five_neuroticism', label: 'Neuroticismo' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Big Five */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Big Five (OCEAN)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bigFiveFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <Label className="text-[10px] uppercase text-muted-foreground">{field.label}</Label>
                  <span>{formData[field.key] || 0}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input 
                    type="range" 
                    min="0" max="100" 
                    value={formData[field.key] || 0}
                    onChange={(e) => setFormData({ ...formData, [field.key]: parseInt(e.target.value) })}
                    className="h-4 flex-1 accent-primary"
                  />
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Label className="text-xs">Confiança da Análise ({formData.big_five_confidence || 0}%)</Label>
              <Input 
                type="range" 
                min="0" max="100" 
                value={formData.big_five_confidence || 0}
                onChange={(e) => setFormData({ ...formData, big_five_confidence: parseInt(e.target.value) })}
                className="h-4 w-full accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* MBTI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              MBTI (16 Personalidades)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo MBTI</Label>
              <Input 
                value={formData.mbti_type || ""} 
                onChange={(e) => setFormData({ ...formData, mbti_type: e.target.value.toUpperCase() })}
                placeholder="Ex: INTJ, ENFP..."
                maxLength={4}
                className="font-bold tracking-widest"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px]">E vs I ({formData.mbti_e_i_score || 0}%)</Label>
                <Progress value={formData.mbti_e_i_score || 0} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">S vs N ({formData.mbti_s_n_score || 0}%)</Label>
                <Progress value={formData.mbti_s_n_score || 0} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">T vs F ({formData.mbti_t_f_score || 0}%)</Label>
                <Progress value={formData.mbti_t_f_score || 0} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">J vs P ({formData.mbti_j_p_score || 0}%)</Label>
                <Progress value={formData.mbti_j_p_score || 0} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enneagram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              Eneagrama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Principal (1-9)</Label>
                <Select 
                  value={formData.enneagram_type?.toString()} 
                  onValueChange={(val) => setFormData({ ...formData, enneagram_type: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9].map(t => <SelectItem key={t} value={t.toString()}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Asa (Wing)</Label>
                <Select 
                  value={formData.enneagram_wing?.toString()} 
                  onValueChange={(val) => setFormData({ ...formData, enneagram_wing: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Asa" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9].map(t => <SelectItem key={t} value={t.toString()}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temperament */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              Temperamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primário</Label>
                <Select 
                  value={formData.temperament_primary} 
                  onValueChange={(val) => setFormData({ ...formData, temperament_primary: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colerico">Colérico</SelectItem>
                    <SelectItem value="sanguineo">Sanguíneo</SelectItem>
                    <SelectItem value="fleumatico">Fleumático</SelectItem>
                    <SelectItem value="melancolico">Melancólico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Secundário</Label>
                <Select 
                  value={formData.temperament_secondary} 
                  onValueChange={(val) => setFormData({ ...formData, temperament_secondary: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colerico">Colérico</SelectItem>
                    <SelectItem value="sanguineo">Sanguíneo</SelectItem>
                    <SelectItem value="fleumatico">Fleumático</SelectItem>
                    <SelectItem value="melancolico">Melancólico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas de Temperamento</Label>
              <Input 
                value={formData.temperament_notes || ""} 
                onChange={(e) => setFormData({ ...formData, temperament_notes: e.target.value })}
                placeholder="Observações adicionais..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Frameworks de Personalidade
        </Button>
      </div>
    </div>
  );
}
