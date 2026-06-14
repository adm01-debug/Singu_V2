import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Eye, 
  Ear, 
  Hand,
  Focus,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { VAKType } from '@/types/vak';
import { getDominantVAK } from '@/lib/contact-utils';
import { DEMO_CONTACT } from '@/domain/demoEntities';

interface Submodality {
  id: string;
  name: string;
  category: 'visual' | 'auditory' | 'kinesthetic';
  fromValue: string;
  toValue: string;
  currentValue: number;
  script: string;
}

interface SubmodalityModifierProps {
  contact?: Contact;
  className?: string;
}

const SUBMODALITIES: Submodality[] = [
  // Visual
  { id: 'brightness', name: 'Brilho', category: 'visual', fromValue: 'Escuro', toValue: 'Brilhante', currentValue: 50, script: 'Agora, aumente o brilho dessa imagem... deixe-a mais clara e luminosa...' },
  { id: 'size', name: 'Tamanho', category: 'visual', fromValue: 'Pequeno', toValue: 'Grande', currentValue: 50, script: 'Amplie essa imagem... faça-a maior... até preencher toda sua visão...' },
  { id: 'distance', name: 'Distância', category: 'visual', fromValue: 'Longe', toValue: 'Perto', currentValue: 50, script: 'Traga essa imagem para mais perto... sinta como ela se aproxima de você...' },
  { id: 'color', name: 'Cor', category: 'visual', fromValue: 'Preto/Branco', toValue: 'Colorido', currentValue: 50, script: 'Adicione cores vibrantes a essa imagem... veja como ela ganha vida...' },
  { id: 'focus', name: 'Foco', category: 'visual', fromValue: 'Desfocado', toValue: 'Nítido', currentValue: 50, script: 'Deixe essa imagem mais nítida... cada detalhe ficando claro...' },
  
  // Auditory
  { id: 'volume', name: 'Volume', category: 'auditory', fromValue: 'Baixo', toValue: 'Alto', currentValue: 50, script: 'Aumente o volume dessa voz... deixe-a mais forte e clara...' },
  { id: 'tone', name: 'Tom', category: 'auditory', fromValue: 'Grave', toValue: 'Agudo', currentValue: 50, script: 'Mude o tom dessa voz... encontre o tom que te inspira...' },
  { id: 'tempo', name: 'Ritmo', category: 'auditory', fromValue: 'Lento', toValue: 'Rápido', currentValue: 50, script: 'Ajuste o ritmo... encontre a velocidade perfeita para você...' },
  { id: 'location', name: 'Localização', category: 'auditory', fromValue: 'Externa', toValue: 'Interna', currentValue: 50, script: 'Traga esse som para dentro de você... deixe-o ressoar internamente...' },
  
  // Kinesthetic
  { id: 'intensity', name: 'Intensidade', category: 'kinesthetic', fromValue: 'Leve', toValue: 'Intenso', currentValue: 50, script: 'Amplifique essa sensação... sinta-a se tornando mais forte...' },
  { id: 'pressure', name: 'Pressão', category: 'kinesthetic', fromValue: 'Suave', toValue: 'Firme', currentValue: 50, script: 'Ajuste a pressão dessa sensação... encontre o ponto ideal...' },
  { id: 'temperature', name: 'Temperatura', category: 'kinesthetic', fromValue: 'Frio', toValue: 'Quente', currentValue: 50, script: 'Sinta o calor dessa experiência... deixe-o se espalhar pelo seu corpo...' },
  { id: 'movement', name: 'Movimento', category: 'kinesthetic', fromValue: 'Parado', toValue: 'Em movimento', currentValue: 50, script: 'Adicione movimento a essa sensação... sinta a energia fluindo...' }
];

const SubmodalityModifier: React.FC<SubmodalityModifierProps> = ({
  contact,
  className
}) => {
  const activeContact = contact || DEMO_CONTACT;
  const [submodalities, setSubmodalities] = useState<Submodality[]>(SUBMODALITIES);
  const [selectedCategory, setSelectedCategory] = useState<'visual' | 'auditory' | 'kinesthetic'>('visual');
  const [activeModification, setActiveModification] = useState<string | null>(null);

  const vakType = getDominantVAK(activeContact) as VAKType || 'V';

  const updateSubmodality = (id: string, value: number) => {
    setSubmodalities(prev => prev.map(s => 
      s.id === id ? { ...s, currentValue: value } : s
    ));
  };

  const filteredSubmodalities = submodalities.filter(s => s.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visual': return <Eye className="h-4 w-4" />;
      case 'auditory': return <Ear className="h-4 w-4" />;
      case 'kinesthetic': return <Hand className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getRecommendedCategory = () => {
    switch (vakType) {
      case 'V': return 'visual';
      case 'A': return 'auditory';
      case 'K': return 'kinesthetic';
      default: return 'visual';
    }
  };

  return (
    <Card className={cn("border-accent/30 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Focus className="h-5 w-5 text-accent" />
            Submodality Modifier
          </CardTitle>
          <Badge variant="outline" className="bg-accent/20">
            VAK: {vakType}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Modifique submodalidades VAK para mudar a intensidade emocional de {activeContact.firstName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['visual', 'auditory', 'kinesthetic'] as const).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "relative",
                getRecommendedCategory() === cat && selectedCategory !== cat && 'ring-2 ring-accent/50'
              )}
            >
              {getCategoryIcon(cat)}
              <span className="ml-1 capitalize">
                {cat === 'visual' ? 'Visual' : cat === 'auditory' ? 'Auditivo' : 'Cinestésico'}
              </span>
              {getRecommendedCategory() === cat && (
                <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[8px]">★</Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Recommendation */}
        <div className="bg-accent/10 rounded-lg p-2 text-xs flex items-center gap-2">
          <Lightbulb className="h-3 w-3 text-accent shrink-0" />
          <span className="text-muted-foreground">
            {activeContact.firstName} é {vakType === 'V' ? 'Visual' : vakType === 'A' ? 'Auditivo' : vakType === 'K' ? 'Cinestésico' : 'Digital'} - 
            submodalidades {getRecommendedCategory() === 'visual' ? 'visuais' : getRecommendedCategory() === 'auditory' ? 'auditivas' : 'cinestésicas'} terão mais impacto.
          </span>
        </div>

        {/* Submodality Sliders */}
        <div className="space-y-4">
          {filteredSubmodalities.map(sub => (
            <motion.div
              key={sub.id}
              layout
              className={cn(
                "bg-muted/30 rounded-lg p-3 transition-all",
                activeModification === sub.id && 'bg-accent/20 ring-1 ring-accent/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{sub.name}</span>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  sub.currentValue > 70 ? 'bg-success/20 text-success' :
                  sub.currentValue < 30 ? 'bg-info/20 text-info' :
                  'bg-muted'
                )}>
                  {sub.currentValue}%
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20">{sub.fromValue}</span>
                <Slider
                  value={[sub.currentValue]}
                  onValueChange={([v]) => updateSubmodality(sub.id, v)}
                  onValueCommit={() => setActiveModification(sub.id)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-20 text-right">{sub.toValue}</span>
              </div>

              {activeModification === sub.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-accent/30"
                >
                  <div className="text-xs font-medium text-accent mb-1">Script de Modificação:</div>
                  <p className="text-xs italic text-muted-foreground">
                    "{sub.script}"
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Usage Guide */}
        <div className="bg-muted/20 rounded-lg p-3 space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <Lightbulb className="h-3 w-3 text-accent" />
            Como Usar Submodalidades em Vendas
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong className="text-success">Para AMPLIFICAR emoções positivas:</strong>{' '}
              Aumente brilho, tamanho, intensidade, volume.
            </p>
            <p>
              <strong className="text-info">Para REDUZIR emoções negativas:</strong>{' '}
              Diminua, afaste, escureça, abaixe o volume.
            </p>
            <p>
              <strong className="text-warning">Exemplo prático:</strong>{' '}
              "Imagine o sucesso... agora aumente o brilho dessa imagem... veja-a maior..."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmodalityModifier;
