// ==============================================
// NEUROCHEMICAL INFLUENCE MAP - Interactive Visualization
// ==============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Heart,
  Zap,
  AlertTriangle,
  Smile,
  Trophy,
  Flame,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Neurochemical } from '@/types/neuromarketing';
import { NEUROCHEMICAL_INFO } from '@/data/neuromarketingData';
import { cn } from '@/lib/utils';

interface NeurochemicalInfluenceMapProps {
  className?: string;
  highlightChemical?: Neurochemical;
  onSelectChemical?: (chemical: Neurochemical) => void;
}

interface ChemicalCardData {
  chemical: Neurochemical;
  icon: React.ReactNode;
  triggers: string[];
  salesTactics: string[];
  warnings: string[];
  bestFor: string;
}

const CHEMICAL_DATA: ChemicalCardData[] = [
  {
    chemical: 'dopamine',
    icon: <Zap className="h-5 w-5" />,
    triggers: [
      'Novidades e surpresas',
      'Recompensas inesperadas',
      'Gamificação',
      'Progresso visível',
      'Antecipação de ganhos'
    ],
    salesTactics: [
      'Revele benefícios gradualmente',
      'Ofereça bônus surpresa',
      'Use "exclusivo" e "novo"',
      'Crie senso de progresso'
    ],
    warnings: [
      'Excesso pode parecer manipulativo',
      'Cuidado com promessas não cumpridas'
    ],
    bestFor: 'Gerar interesse e desejo'
  },
  {
    chemical: 'oxytocin',
    icon: <Heart className="h-5 w-5" />,
    triggers: [
      'Contato visual prolongado',
      'Histórias pessoais',
      'Vulnerabilidade autêntica',
      'Valores compartilhados',
      'Toque físico apropriado'
    ],
    salesTactics: [
      'Compartilhe sua própria história',
      'Encontre interesses em comum',
      'Mostre genuína preocupação',
      'Use depoimentos emocionais'
    ],
    warnings: [
      'Nunca finja intimidade',
      'Construção leva tempo'
    ],
    bestFor: 'Construir confiança e rapport'
  },
  {
    chemical: 'cortisol',
    icon: <AlertTriangle className="h-5 w-5" />,
    triggers: [
      'Escassez genuína',
      'Prazos reais',
      'Risco de perda',
      'Ameaça competitiva',
      'Consequências da inação'
    ],
    salesTactics: [
      'Mostre o custo de não agir',
      'Use "últimas unidades" se verdade',
      'Destaque o que concorrentes ganham',
      'Quantifique perdas por dia/mês'
    ],
    warnings: [
      'Uso excessivo causa resistência',
      'Nunca crie urgência falsa'
    ],
    bestFor: 'Criar urgência e ação'
  },
  {
    chemical: 'serotonin',
    icon: <Trophy className="h-5 w-5" />,
    triggers: [
      'Reconhecimento público',
      'Status elevado',
      'Pertencer a grupo seleto',
      'Validação social',
      'Conquistas destacadas'
    ],
    salesTactics: [
      'Mencione clientes de prestígio',
      'Ofereça níveis VIP/Premium',
      'Destaque exclusividade',
      'Valide as conquistas do cliente'
    ],
    warnings: [
      'Pode parecer elitista',
      'Autenticidade é crucial'
    ],
    bestFor: 'Elevar status e confiança'
  },
  {
    chemical: 'endorphin',
    icon: <Smile className="h-5 w-5" />,
    triggers: [
      'Humor e risadas',
      'Alívio de dor/stress',
      'Conquistas e vitórias',
      'Exercício e movimento',
      'Surpresas positivas'
    ],
    salesTactics: [
      'Use humor apropriado',
      'Mostre alívio de problemas',
      'Celebre pequenas vitórias',
      'Quebre tensão com leveza'
    ],
    warnings: [
      'Humor mal calibrado afasta',
      'Timing é essencial'
    ],
    bestFor: 'Criar prazer e bem-estar'
  },
  {
    chemical: 'adrenaline',
    icon: <Flame className="h-5 w-5" />,
    triggers: [
      'Desafios empolgantes',
      'Competição saudável',
      'Riscos calculados',
      'Aventura e novidade',
      'Decisões rápidas'
    ],
    salesTactics: [
      'Proponha desafios ousados',
      'Use linguagem de conquista',
      'Crie senso de aventura',
      'Aproveite momentum decisório'
    ],
    warnings: [
      'Pode causar arrependimento',
      'Nem todos buscam risco'
    ],
    bestFor: 'Impulsionar ação rápida'
  }
];

const NeurochemicalInfluenceMap = ({
  className,
  highlightChemical,
  onSelectChemical
}: NeurochemicalInfluenceMapProps) => {
  const [selectedChemical, setSelectedChemical] = useState<Neurochemical | null>(
    highlightChemical || null
  );

  const handleSelect = (chemical: Neurochemical) => {
    setSelectedChemical(chemical);
    onSelectChemical?.(chemical);
  };

  const handleClose = () => {
    setSelectedChemical(null);
  };

  const selectedData = selectedChemical 
    ? CHEMICAL_DATA.find(c => c.chemical === selectedChemical)
    : null;

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Mapa de Influência Neuroquímica</CardTitle>
            <p className="text-xs text-muted-foreground">
              Clique em um neuroquímico para ver como ativá-lo
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chemical Grid */}
        <div className="grid grid-cols-3 gap-2">
          {CHEMICAL_DATA.map((data) => {
            const info = NEUROCHEMICAL_INFO[data.chemical];
            const isSelected = selectedChemical === data.chemical;
            
            return (
              <motion.button
                key={data.chemical}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(data.chemical)}
                className={cn(
                  "p-3 rounded-lg border text-center transition-all",
                  isSelected 
                    ? "ring-2 ring-offset-2" 
                    : "hover:bg-accent/50"
                )}
                style={{ 
                  borderColor: isSelected ? info.color : undefined,
                  boxShadow: isSelected ? `0 0 20px ${info.color}30` : undefined
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${info.color}20`,
                    color: info.color
                  }}
                >
                  {data.icon}
                </div>
                <p className="text-sm font-medium">{info.namePt}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {data.bestFor}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  borderColor: NEUROCHEMICAL_INFO[selectedData.chemical].color,
                  backgroundColor: `${NEUROCHEMICAL_INFO[selectedData.chemical].color}05`
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: NEUROCHEMICAL_INFO[selectedData.chemical].color,
                        color: 'white'
                      }}
                    >
                      {selectedData.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {NEUROCHEMICAL_INFO[selectedData.chemical].namePt}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedData.bestFor}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleClose}
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Triggers */}
                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      Gatilhos de Ativação
                    </h5>
                    <ul className="space-y-1">
                      {selectedData.triggers.map((trigger, idx) => (
                        <li 
                          key={idx}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <ChevronRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                          {trigger}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sales Tactics */}
                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-success" />
                      Táticas de Vendas
                    </h5>
                    <ul className="space-y-1">
                      {selectedData.salesTactics.map((tactic, idx) => (
                        <li 
                          key={idx}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <ChevronRight className="h-3 w-3 mt-0.5 text-success flex-shrink-0" />
                          {tactic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Warnings */}
                <div className="mt-4 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h5 className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    Cuidados
                  </h5>
                  <ul className="space-y-0.5">
                    {selectedData.warnings.map((warning, idx) => (
                      <li 
                        key={idx}
                        className="text-xs text-destructive/80"
                      >
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state hint */}
        {!selectedChemical && (
          <div className="text-center py-4 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Selecione um neuroquímico acima</p>
            <p className="text-xs">para ver como ativá-lo nas suas vendas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeurochemicalInfluenceMap;
