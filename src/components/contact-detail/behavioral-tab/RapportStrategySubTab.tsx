import { Handshake, Save, Volume2, Eye, Fingerprint, Zap, MousePointer2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function RapportStrategySubTab({ contactId }: Props) {
  const { rapport, updateRapport, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (rapport) setFormData(rapport);
  }, [rapport]);

  if (isLoading) return <div className="p-8 text-center">Carregando estratégia de rapport...</div>;

  const handleSave = () => updateRapport(formData);

  const sensoryChannels = [
    { key: 'visual_preference_score', label: 'Visual', icon: Eye, color: 'text-blue-500' },
    { key: 'auditory_preference_score', label: 'Auditivo', icon: Volume2, color: 'text-green-500' },
    { key: 'kinesthetic_preference_score', label: 'Cinestésico', icon: Fingerprint, color: 'text-orange-500' },
    { key: 'digital_preference_score', label: 'Digital (Lógica)', icon: MousePointer2, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sensory Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Preferência Sensorial (VAKD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sensoryChannels.map((channel) => (
              <div key={channel.key} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <Label className="flex items-center gap-1.5 uppercase text-muted-foreground text-[10px]">
                    <channel.icon className={`h-3 w-3 ${channel.color}`} />
                    {channel.label}
                  </Label>
                  <span className="font-mono">{formData[channel.key] || 0}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input 
                    type="range" 
                    min="0" max="100" 
                    value={formData[channel.key] || 0}
                    onChange={(e) => setFormData({ ...formData, [channel.key]: parseInt(e.target.value) })}
                    className="h-4 flex-1 accent-primary"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Communication & Pacing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-accent" />
              Estilo & Sincronia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Velocidade (Pacing)</Label>
              <Select 
                value={formData.pacing_speed} 
                onValueChange={(val) => setFormData({ ...formData, pacing_speed: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione o ritmo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Lento (Calmo/Analítico)</SelectItem>
                  <SelectItem value="medium">Médio (Padrão)</SelectItem>
                  <SelectItem value="fast">Rápido (Energético/Direto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Técnica de Espelhamento</Label>
              <Input 
                value={formData.mirroring_technique || ""} 
                onChange={(e) => setFormData({ ...formData, mirroring_technique: e.target.value })}
                placeholder="Ex: Espelhamento cruzado, Backtracking..."
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Tom de Voz Preferido</Label>
              <Input 
                value={formData.voice_tone_preferred || ""} 
                onChange={(e) => setFormData({ ...formData, voice_tone_preferred: e.target.value })}
                placeholder="Ex: Consultivo, Amigável, Autoritário..."
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Emotional Anchors & Resistance */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Handshake className="h-4 w-4 text-success" />
              Ancoragem & Gatilhos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Âncoras Positivas (Separadas por vírgula)</Label>
              <Textarea 
                value={formData.emotional_anchors?.join(", ") || ""} 
                onChange={(e) => setFormData({ ...formData, emotional_anchors: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
                placeholder="Palavras ou tópicos que geram estados positivos..."
                className="min-h-[80px] text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Gatilhos de Resistência</Label>
              <Textarea 
                value={formData.resistance_triggers?.join(", ") || ""} 
                onChange={(e) => setFormData({ ...formData, resistance_triggers: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
                placeholder="Tópicos ou comportamentos a evitar..."
                className="min-h-[80px] text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Estratégia de Rapport
        </Button>
      </div>
    </div>
  );
}
