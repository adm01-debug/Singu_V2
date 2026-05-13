import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Layers, 
  ChevronUp, 
  ChevronDown, 
  ArrowLeftRight,
  Lightbulb,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { getDISCProfile, getContactBehavior } from '@/lib/contact-utils';
import { toast } from '@/hooks/use-toast';
import { DEMO_CONTACT } from '@/domain/demoEntities';

interface ChunkLevel {
  level: 'abstract' | 'mid' | 'specific';
  name: string;
  description: string;
  examples: string[];
  questions: string[];
}

interface ChunkingNavigatorProps {
  contact?: Contact;
  topic?: string;
  className?: string;
}

const CHUNK_LEVELS: ChunkLevel[] = [
  {
    level: 'abstract',
    name: 'CHUNK UP - Abstrato',
    description: 'Mover para conceitos mais amplos, valores e propósitos',
    examples: ['Para que serve isso?', 'Qual o objetivo maior?', 'O que isso representa?'],
    questions: [
      'Para que você quer isso?',
      'O que isso vai te permitir fazer/ser/ter?',
      'Qual é a intenção por trás disso?',
      'Do que isso faz parte?'
    ]
  },
  {
    level: 'mid',
    name: 'CHUNK LATERAL - Paralelo',
    description: 'Explorar alternativas e opções no mesmo nível',
    examples: ['O que mais poderia funcionar?', 'Que outras opções existem?'],
    questions: [
      'O que mais você está considerando?',
      'Quais outras opções você vê?',
      'Como outros fazem isso?',
      'Existe outra forma de conseguir o mesmo resultado?'
    ]
  },
  {
    level: 'specific',
    name: 'CHUNK DOWN - Específico',
    description: 'Descer para detalhes, exemplos e ações concretas',
    examples: ['Como exatamente?', 'Pode dar um exemplo?', 'O que especificamente?'],
    questions: [
      'Como especificamente?',
      'Pode me dar um exemplo?',
      'Qual seria o primeiro passo?',
      'O que exatamente você quer dizer com isso?'
    ]
  }
];

const ChunkingNavigator: React.FC<ChunkingNavigatorProps> = ({
  contact,
  topic = '',
  className
}) => {
  const activeContact = contact || DEMO_CONTACT;
  const [currentLevel, setCurrentLevel] = useState<'abstract' | 'mid' | 'specific'>('mid');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const discProfile = (getDISCProfile(activeContact) as DISCProfile) || 'D';
  const behavior = getContactBehavior(activeContact);
  const metaChunk = behavior?.metaprogramProfile?.chunkSize || 'balanced';

  // Recommend direction based on metaprogram
  const recommendedDirection = useMemo(() => {
    if (metaChunk === 'general') {
      return { direction: 'down', reason: 'Cliente prefere visão geral - use chunk down para detalhes quando necessário' };
    } else if (metaChunk === 'specific') {
      return { direction: 'up', reason: 'Cliente foca em detalhes - use chunk up para mostrar visão macro' };
    }
    return { direction: 'lateral', reason: 'Cliente é equilibrado - navegue conforme a conversa' };
  }, [metaChunk]);

  // DISC-based chunking strategy
  const discChunkingTip = useMemo(() => {
    switch (discProfile) {
      case 'D':
        return 'Perfil D: Prefere chunk up (visão geral e resultados). Só vá para específicos se pedirem.';
      case 'I':
        return 'Perfil I: Gosta de explorar lateralmente (opções e possibilidades). Mantenha entusiasmo.';
      case 'S':
        return 'Perfil S: Prefere chunk down (detalhes e segurança). Vá devagar em cada nível.';
      case 'C':
        return 'Perfil C: Quer todos os níveis! Comece específico e mostre como conecta ao macro.';
      default:
        return '';
    }
  }, [discProfile]);

  const currentChunk = CHUNK_LEVELS.find(c => c.level === currentLevel)!;

  const copyQuestion = (question: string, index: number) => {
    navigator.clipboard.writeText(question);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copiado!",
      description: "Pergunta copiada para a área de transferência"
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'abstract': return 'text-secondary bg-secondary/20 border-secondary/30';
      case 'mid': return 'text-info bg-info/20 border-info/30';
      case 'specific': return 'text-success bg-success/20 border-success/30';
      default: return '';
    }
  };

  return (
    <Card className={cn("border-info/30 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-info" />
            Chunking Navigator
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-info/20">
              Meta: {metaChunk === 'general' ? 'Geral' : metaChunk === 'specific' ? 'Específico' : 'Equilibrado'}
            </Badge>
            <Badge variant="outline" className="bg-secondary/20">
              {discProfile}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Navegue entre níveis de abstração na conversa com {activeContact.firstName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={currentLevel === 'abstract' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentLevel('abstract')}
            className="flex-col h-auto py-2"
          >
            <ChevronUp className="h-4 w-4 mb-1" />
            <span className="text-xs">Chunk Up</span>
          </Button>
          
          <Button
            variant={currentLevel === 'mid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentLevel('mid')}
            className="flex-col h-auto py-2"
          >
            <ArrowLeftRight className="h-4 w-4 mb-1" />
            <span className="text-xs">Lateral</span>
          </Button>
          
          <Button
            variant={currentLevel === 'specific' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentLevel('specific')}
            className="flex-col h-auto py-2"
          >
            <ChevronDown className="h-4 w-4 mb-1" />
            <span className="text-xs">Chunk Down</span>
          </Button>
        </div>

        {/* Current Level Details */}
        <motion.div
          key={currentLevel}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("rounded-lg p-4 border", getLevelColor(currentLevel))}
        >
          <h4 className="font-medium text-sm mb-2">{currentChunk.name}</h4>
          <p className="text-xs text-muted-foreground mb-3">{currentChunk.description}</p>

          {/* Questions */}
          <div className="space-y-2">
            <div className="text-xs font-medium flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Perguntas para Usar:
            </div>
            {currentChunk.questions.map((q, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => copyQuestion(q, idx)}
                className="w-full text-left bg-background/50 rounded p-2 text-sm hover:bg-background/80 transition-colors flex items-center justify-between group"
              >
                <span>"{q}"</span>
                {copiedIndex === idx ? (
                  <Check className="h-3 w-3 text-success" />
                ) : (
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recommendation */}
        <div className="bg-info/10 rounded-lg p-3 border border-info/30">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-info mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-info mb-1">
                Recomendação para {activeContact.firstName}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {recommendedDirection.reason}
              </p>
              <p className="text-xs text-muted-foreground">
                💡 {discChunkingTip}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Hierarchy */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs font-medium mb-2">Hierarquia de Abstração:</div>
          <div className="space-y-1">
            <div className={cn(
              "px-3 py-1 rounded text-xs flex items-center justify-between",
              currentLevel === 'abstract' ? 'bg-secondary/30 text-secondary' : 'bg-muted/50'
            )}>
              <span>🌌 Propósito / Valores / "Para quê?"</span>
              <ChevronUp className="h-3 w-3" />
            </div>
            <div className={cn(
              "px-3 py-1 rounded text-xs flex items-center justify-between",
              currentLevel === 'mid' ? 'bg-info/30 text-info' : 'bg-muted/50'
            )}>
              <span>🔄 Categoria / Alternativas / "O que mais?"</span>
              <ArrowLeftRight className="h-3 w-3" />
            </div>
            <div className={cn(
              "px-3 py-1 rounded text-xs flex items-center justify-between",
              currentLevel === 'specific' ? 'bg-success/30 text-success' : 'bg-muted/50'
            )}>
              <span>🔍 Detalhes / Exemplos / "Como exatamente?"</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Quick Navigation Tips */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-secondary/10 rounded p-2 text-center">
            <ChevronUp className="h-3 w-3 mx-auto mb-1 text-secondary" />
            <div className="text-secondary">Up</div>
            <div className="text-muted-foreground">Valores</div>
          </div>
          <div className="bg-info/10 rounded p-2 text-center">
            <ArrowLeftRight className="h-3 w-3 mx-auto mb-1 text-info" />
            <div className="text-info">Lateral</div>
            <div className="text-muted-foreground">Opções</div>
          </div>
          <div className="bg-success/10 rounded p-2 text-center">
            <ChevronDown className="h-3 w-3 mx-auto mb-1 text-success" />
            <div className="text-success">Down</div>
            <div className="text-muted-foreground">Detalhes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChunkingNavigator;
