import { Shield, Brain, Star, Activity, Save, Info, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TEMPERAMENT_TYPES, TemperamentType } from '@/types/temperament';
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
    { key: 'big_five_openness', label: 'Abertura (Openness)', desc: 'Curiosidade, criatividade e novas experiências.' },
    { key: 'big_five_conscientiousness', label: 'Conscienciosidade', desc: 'Disciplina, organização e foco em objetivos.' },
    { key: 'big_five_extraversion', label: 'Extroversão', desc: 'Energia social, assertividade e busca por estímulos.' },
    { key: 'big_five_agreeableness', label: 'Amabilidade', desc: 'Confiança, altruísmo e cooperação.' },
    { key: 'big_five_neuroticism', label: 'Neuroticismo', desc: 'Sensibilidade emocional e resposta ao estresse.' },
  ];

  const mbtiDimensions = [
    { key: 'mbti_e_i_score', left: 'E (Extroversão)', right: 'I (Introversão)', desc: 'Como o contato recarrega energias.' },
    { key: 'mbti_s_n_score', left: 'S (Sensação)', right: 'N (Intuição)', desc: 'Como o contato processa informações.' },
    { key: 'mbti_t_f_score', left: 'T (Pensamento)', right: 'F (Sentimento)', desc: 'Como o contato toma decisões.' },
    { key: 'mbti_j_p_score', left: 'J (Julgamento)', right: 'P (Percepção)', desc: 'Como o contato se organiza.' },
  ];

  const enneagramTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handleEnneagramScore = (type: number, score: number) => {
    const currentScores = typeof formData.enneagram_scores === 'object' ? { ...formData.enneagram_scores } : {};
    currentScores[type.toString()] = score;
    setFormData({ ...formData, enneagram_scores: currentScores });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Big Five */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Big Five (OCEAN)
              </div>
              <Badge variant="outline" className="text-[10px] font-normal">
                Confiança: {formData.big_five_confidence || 0}%
              </Badge>
            </CardTitle>
            <CardDescription className="text-[10px]">As 5 dimensões universais da personalidade humana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TooltipProvider>
              {bigFiveFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">{field.label}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger>
                        <TooltipContent><p className="text-[10px] max-w-[200px]">{field.desc}</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-primary">{formData[field.key] || 0}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="range" min="0" max="100" 
                      value={formData[field.key] || 0}
                      onChange={(e) => setFormData({ ...formData, [field.key]: parseInt(e.target.value) })}
                      className="h-4 flex-1 accent-primary"
                    />
                  </div>
                </div>
              ))}
            </TooltipProvider>
            <div className="pt-2 border-t mt-4">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Calibração de Confiança</Label>
              <Input 
                type="range" min="0" max="100" 
                value={formData.big_five_confidence || 0}
                onChange={(e) => setFormData({ ...formData, big_five_confidence: parseInt(e.target.value) })}
                className="h-4 w-full accent-primary mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* MBTI */}
        <Card className="border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              MBTI (16 Personalidades)
            </CardTitle>
            <CardDescription className="text-[10px]">Preferências psicológicas e tomada de decisão.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo Resultante</Label>
              <div className="relative">
                <Input 
                  value={formData.mbti_type || ""} 
                  onChange={(e) => setFormData({ ...formData, mbti_type: e.target.value.toUpperCase() })}
                  placeholder="Ex: INTJ, ENFP..."
                  maxLength={4}
                  className="font-black text-xl tracking-[0.2em] text-center h-12 border-2 border-accent/20 bg-accent/5 uppercase"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent/40"><Brain className="h-5 w-5" /></div>
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <TooltipProvider>
                {mbtiDimensions.map((dim) => (
                  <div key={dim.key} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className={formData[dim.key] < 50 ? "text-accent" : "text-muted-foreground"}>{dim.left}</span>
                      <Tooltip>
                        <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground/30 cursor-help" /></TooltipTrigger>
                        <TooltipContent><p className="text-[10px]">{dim.desc}</p></TooltipContent>
                      </Tooltip>
                      <span className={formData[dim.key] > 50 ? "text-accent" : "text-muted-foreground"}>{dim.right}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="range" min="0" max="100" 
                        value={formData[dim.key] || 50}
                        onChange={(e) => setFormData({ ...formData, [dim.key]: parseInt(e.target.value) })}
                        className="h-4 flex-1 accent-accent"
                      />
                    </div>
                  </div>
                ))}
              </TooltipProvider>
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
            <div className="space-y-2">
              <Label>Scores por Tipo (JSON)</Label>
              <Textarea 
                value={typeof formData.enneagram_scores === 'object' ? JSON.stringify(formData.enneagram_scores, null, 2) : formData.enneagram_scores || ""} 
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData({ ...formData, enneagram_scores: parsed });
                  } catch {
                    setFormData({ ...formData, enneagram_scores: e.target.value });
                  }
                }}
                placeholder='{"1": 85, "2": 40...}'
                className="font-mono text-[10px] min-h-[60px]"
              />
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
