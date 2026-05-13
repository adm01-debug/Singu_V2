import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  MessageCircle, 
  Copy, 
  Check,
  Eye,
  Ear,
  Hand,
  Brain,
  Wand2,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';
import { getDominantVAK, getDISCProfile } from '@/lib/contact-utils';
import { toast } from '@/hooks/use-toast';
import { DEMO_CONTACT } from '@/domain/demoEntities';

interface MiltonPattern {
  id: string;
  name: string;
  category: 'presupposition' | 'embedded' | 'metaphor' | 'pacing' | 'hypnotic';
  description: string;
  template: string;
  example: string;
  adaptedExample: string;
  whenToUse: string;
}

interface MiltonianCalibrationProps {
  contact?: Contact;
  context?: string;
  className?: string;
}

const MILTON_PATTERNS: MiltonPattern[] = [
  // Pressuposições
  {
    id: 'presup-time',
    name: 'Pressuposto Temporal',
    category: 'presupposition',
    description: 'Assume que algo vai acontecer, questiona apenas quando',
    template: 'Quando você [ação desejada], você vai notar que...',
    example: 'Quando você começar a usar, vai perceber a diferença',
    adaptedExample: '',
    whenToUse: 'Quando o cliente está indeciso sobre começar'
  },
  {
    id: 'presup-awareness',
    name: 'Pressuposto de Consciência',
    category: 'presupposition',
    description: 'Assume que o cliente já está percebendo algo',
    template: 'Você já deve ter percebido que...',
    example: 'Você já deve ter percebido como isso facilitaria seu dia',
    adaptedExample: '',
    whenToUse: 'Para validar benefícios sem parecer vendedor'
  },
  {
    id: 'presup-ordinal',
    name: 'Pressuposto Ordinal',
    category: 'presupposition',
    description: 'Assume que há múltiplas opções, todas favoráveis',
    template: 'A primeira coisa que você vai [benefício] é...',
    example: 'A primeira coisa que você vai economizar é tempo',
    adaptedExample: '',
    whenToUse: 'Para implantar expectativa de múltiplos benefícios'
  },

  // Comandos Embutidos
  {
    id: 'embed-quote',
    name: 'Citação Embutida',
    category: 'embedded',
    description: 'Comando disfarçado como citação de terceiro',
    template: 'Um cliente me disse: "[comando]"',
    example: 'Um cliente me disse: "Não espere mais, comece agora"',
    adaptedExample: '',
    whenToUse: 'Para dar comandos sem parecer diretivo'
  },
  {
    id: 'embed-negative',
    name: 'Comando Negativo',
    category: 'embedded',
    description: 'A mente ignora o "não" no comando',
    template: 'Não precisa [ação desejada] agora...',
    example: 'Não precisa decidir agora... apenas imagine como seria',
    adaptedExample: '',
    whenToUse: 'Para reduzir resistência a ações'
  },
  {
    id: 'embed-wonder',
    name: 'Maravilhamento',
    category: 'embedded',
    description: 'Induz estado de curiosidade e abertura',
    template: 'Eu me pergunto se você já pensou em...',
    example: 'Eu me pergunto se você já pensou em como seria diferente',
    adaptedExample: '',
    whenToUse: 'Para abrir mente a novas possibilidades'
  },

  // Metáforas
  {
    id: 'meta-journey',
    name: 'Metáfora da Jornada',
    category: 'metaphor',
    description: 'Posiciona a decisão como parte de uma jornada',
    template: 'É como quando você [experiência comum] e descobre que...',
    example: 'É como quando você encontra um atalho que economiza horas',
    adaptedExample: '',
    whenToUse: 'Para criar conexão emocional com o processo'
  },
  {
    id: 'meta-growth',
    name: 'Metáfora de Crescimento',
    category: 'metaphor',
    description: 'Conecta com desejo natural de evolução',
    template: 'Assim como uma semente que...',
    example: 'Assim como uma semente que precisa do solo certo para crescer',
    adaptedExample: '',
    whenToUse: 'Para vendas de desenvolvimento/crescimento'
  },

  // Pacing & Leading
  {
    id: 'pace-yes-set',
    name: 'Yes Set',
    category: 'pacing',
    description: 'Série de verdades óbvias para criar concordância',
    template: '[Verdade 1], [Verdade 2], [Verdade 3], e [sugestão]',
    example: 'Você está aqui, está ouvindo, está interessado, e está pronto para dar o próximo passo',
    adaptedExample: '',
    whenToUse: 'Antes de fazer uma proposta importante'
  },
  {
    id: 'pace-truism',
    name: 'Truísmo',
    category: 'pacing',
    description: 'Verdade universal que cria concordância automática',
    template: 'Todo mundo quer [desejo universal]...',
    example: 'Todo mundo quer segurança para sua família',
    adaptedExample: '',
    whenToUse: 'Para estabelecer terreno comum'
  },

  // Padrões Hipnóticos
  {
    id: 'hyp-bind',
    name: 'Double Bind',
    category: 'hypnotic',
    description: 'Oferece escolhas que levam ao mesmo resultado',
    template: 'Você prefere [opção A] ou [opção B]?',
    example: 'Você prefere começar esta semana ou na próxima?',
    adaptedExample: '',
    whenToUse: 'Para fechar vendas ou agendar compromissos'
  },
  {
    id: 'hyp-amnesia',
    name: 'Amnésia de Objeção',
    category: 'hypnotic',
    description: 'Muda foco antes que objeção se solidifique',
    template: 'Antes disso, deixe-me mostrar algo importante...',
    example: 'Antes de pensar no preço, veja o valor que você recebe',
    adaptedExample: '',
    whenToUse: 'Quando sentir objeção chegando'
  }
];

const MiltonianCalibration: React.FC<MiltonianCalibrationProps> = ({
  contact,
  context = '',
  className
}) => {
  const activeContact = contact || DEMO_CONTACT;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<MiltonPattern | null>(null);

  const vakType = getDominantVAK(activeContact) as VAKType || 'V';
  const discProfile = (getDISCProfile(activeContact) as DISCProfile) || 'D';

  // Adapt patterns to contact profile
  const adaptedPatterns = useMemo(() => {
    return MILTON_PATTERNS.map(pattern => {
      let adapted = pattern.template;

      // VAK adaptation
      if (vakType === 'V') {
        adapted = adapted.replace('[ação desejada]', 'visualizar o resultado');
        adapted = adapted.replace('[benefício]', 'ver claramente');
      } else if (vakType === 'A') {
        adapted = adapted.replace('[ação desejada]', 'ouvir sobre os benefícios');
        adapted = adapted.replace('[benefício]', 'ouvir falar');
      } else if (vakType === 'K') {
        adapted = adapted.replace('[ação desejada]', 'sentir a diferença');
        adapted = adapted.replace('[benefício]', 'sentir');
      } else {
        adapted = adapted.replace('[ação desejada]', 'entender os dados');
        adapted = adapted.replace('[benefício]', 'analisar');
      }

      // DISC adaptation
      if (discProfile === 'D') {
        adapted = adapted.replace('[experiência comum]', 'precisa tomar uma decisão rápida');
      } else if (discProfile === 'I') {
        adapted = adapted.replace('[experiência comum]', 'compartilha uma descoberta empolgante');
      } else if (discProfile === 'S') {
        adapted = adapted.replace('[experiência comum]', 'encontra estabilidade e segurança');
      } else {
        adapted = adapted.replace('[experiência comum]', 'analisa todos os detalhes');
      }

      // Personalize with name
      adapted = adapted.replace('[Nome]', activeContact.firstName);

      return {
        ...pattern,
        adaptedExample: `${activeContact.firstName}, ${adapted}`
      };
    });
  }, [activeContact, vakType, discProfile]);

  const filteredPatterns = selectedCategory === 'all' 
    ? adaptedPatterns 
    : adaptedPatterns.filter(p => p.category === selectedCategory);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copiado!",
      description: "Padrão Miltoniano copiado para a área de transferência"
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'presupposition': return <Sparkles className="h-4 w-4" />;
      case 'embedded': return <MessageCircle className="h-4 w-4" />;
      case 'metaphor': return <BookOpen className="h-4 w-4" />;
      case 'pacing': return <Wand2 className="h-4 w-4" />;
      case 'hypnotic': return <Brain className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'presupposition': return 'bg-secondary/20 text-secondary';
      case 'embedded': return 'bg-info/20 text-info';
      case 'metaphor': return 'bg-success/20 text-success';
      case 'pacing': return 'bg-warning/20 text-warning';
      case 'hypnotic': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getVAKIcon = () => {
    switch (vakType) {
      case 'V': return <Eye className="h-4 w-4" />;
      case 'A': return <Ear className="h-4 w-4" />;
      case 'K': return <Hand className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("border-primary/30 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="h-5 w-5 text-primary" />
            Calibração Miltoniana
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/20">
              {getVAKIcon()}
              <span className="ml-1">{vakType}</span>
            </Badge>
            <Badge variant="outline" className="bg-primary/20">
              DISC: {discProfile}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Linguagem hipnótica ericksoniana adaptada ao perfil VAK/DISC
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            Todos
          </Button>
          {['presupposition', 'embedded', 'metaphor', 'pacing', 'hypnotic'].map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              className="gap-1"
            >
              {getCategoryIcon(cat)}
              {cat === 'presupposition' ? 'Pressupostos' :
               cat === 'embedded' ? 'Embutidos' :
               cat === 'metaphor' ? 'Metáforas' :
               cat === 'pacing' ? 'Pacing' : 'Hipnóticos'}
            </Button>
          ))}
        </div>

        {/* Patterns Grid */}
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {filteredPatterns.map((pattern, idx) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-muted/30 rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getCategoryColor(pattern.category)}>
                      {getCategoryIcon(pattern.category)}
                    </Badge>
                    <span className="font-medium text-sm">{pattern.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => copyToClipboard(pattern.adaptedExample, pattern.id)}
                  >
                    {copiedId === pattern.id ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">{pattern.description}</p>

                <div className="bg-primary/10 rounded p-2">
                  <div className="text-xs text-primary mb-1">Template:</div>
                  <p className="text-sm font-mono">{pattern.template}</p>
                </div>

                <div className="bg-success/10 rounded p-2">
                  <div className="text-xs text-success mb-1">
                    Adaptado para {activeContact.firstName} ({vakType}/{discProfile}):
                  </div>
                  <p className="text-sm italic">"{pattern.adaptedExample}"</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  <strong>Quando usar:</strong> {pattern.whenToUse}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Reference */}
        <div className="bg-muted/20 rounded-lg p-3 text-xs">
          <div className="font-medium mb-2">💡 Dica de Calibração</div>
          <p className="text-muted-foreground">
            Para {activeContact.firstName} ({vakType}/{discProfile}): Use {vakType === 'V' ? 'predicados visuais e ritmo rápido' : 
            vakType === 'A' ? 'variação tonal e pausas dramáticas' :
            vakType === 'K' ? 'palavras de sensação e ritmo lento' :
            'dados específicos e lógica clara'}.
            {discProfile === 'D' ? ' Seja direto e focado em resultados.' :
             discProfile === 'I' ? ' Mantenha energia e entusiasmo.' :
             discProfile === 'S' ? ' Ofereça segurança e estabilidade.' :
             ' Apresente evidências e detalhes.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MiltonianCalibration;
