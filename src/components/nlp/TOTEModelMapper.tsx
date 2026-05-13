import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Settings, 
  CheckCircle2, 
  LogOut,
  ArrowRight,
  Lightbulb,
  Plus,
  Play,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { getDISCProfile } from '@/lib/contact-utils';
import { DEMO_CONTACT } from '@/domain/demoEntities';

interface TOTEPhase {
  id: 'test1' | 'operate' | 'test2' | 'exit';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  clientBehavior: string;
  detectedIndicators: string[];
  salesStrategy: string;
}

interface TOTEModelMapperProps {
  contact?: Contact;
  decisionContext?: string;
  className?: string;
}

const TOTEModelMapper: React.FC<TOTEModelMapperProps> = ({
  contact: providedContact,
  decisionContext = '',
  className
}) => {
  const contact = providedContact || DEMO_CONTACT;
  const [currentPhase, setCurrentPhase] = useState<'test1' | 'operate' | 'test2' | 'exit'>('test1');
  const [observedBehaviors, setObservedBehaviors] = useState<Record<string, string[]>>({
    test1: [],
    operate: [],
    test2: [],
    exit: []
  });
  const [newObservation, setNewObservation] = useState('');

  const discProfile = (getDISCProfile(contact) as DISCProfile) || 'D';

  // TOTE phases adapted to DISC profile
  const totePhases = useMemo((): Record<string, TOTEPhase> => {
    const basePhases = {
      test1: {
        id: 'test1' as const,
        name: 'TEST 1 - Objetivo',
        description: 'Cliente define o que quer alcançar',
        icon: <Target className="h-5 w-5" />,
        color: 'text-info',
        clientBehavior: '',
        detectedIndicators: [],
        salesStrategy: ''
      },
      operate: {
        id: 'operate' as const,
        name: 'OPERATE - Ação',
        description: 'Cliente busca informações e avalia opções',
        icon: <Settings className="h-5 w-5" />,
        color: 'text-warning',
        clientBehavior: '',
        detectedIndicators: [],
        salesStrategy: ''
      },
      test2: {
        id: 'test2' as const,
        name: 'TEST 2 - Verificação',
        description: 'Cliente compara resultado com objetivo',
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: 'text-success',
        clientBehavior: '',
        detectedIndicators: [],
        salesStrategy: ''
      },
      exit: {
        id: 'exit' as const,
        name: 'EXIT - Decisão',
        description: 'Cliente decide agir ou reciclar o processo',
        icon: <LogOut className="h-5 w-5" />,
        color: 'text-secondary',
        clientBehavior: '',
        detectedIndicators: [],
        salesStrategy: ''
      }
    };

    // Adapt to DISC profile
    switch (discProfile) {
      case 'D':
        basePhases.test1.clientBehavior = 'Define objetivo rapidamente, foca em resultados';
        basePhases.test1.detectedIndicators = ['Quer saber logo o ROI', 'Pergunta "quanto tempo?"', 'Foco em ganhos'];
        basePhases.test1.salesStrategy = 'Apresente resultados primeiro, seja direto';
        
        basePhases.operate.clientBehavior = 'Avalia poucas opções, decide rápido';
        basePhases.operate.detectedIndicators = ['Pede resumo', 'Impaciente com detalhes', 'Compara poucos fornecedores'];
        basePhases.operate.salesStrategy = 'Ofereça 2-3 opções claras, destaque diferencial';
        
        basePhases.test2.clientBehavior = 'Verifica se atende ao objetivo principal';
        basePhases.test2.detectedIndicators = ['Pergunta sobre garantias', 'Quer compromisso', 'Testa seu conhecimento'];
        basePhases.test2.salesStrategy = 'Seja assertivo, mostre casos de sucesso rápidos';
        
        basePhases.exit.clientBehavior = 'Decide e quer ação imediata';
        basePhases.exit.detectedIndicators = ['Pergunta "como começamos?"', 'Negocia condições', 'Define prazos'];
        basePhases.exit.salesStrategy = 'Tenha proposta pronta, facilite o fechamento';
        break;

      case 'I':
        basePhases.test1.clientBehavior = 'Define objetivo de forma entusiasta, focado em pessoas';
        basePhases.test1.detectedIndicators = ['Fala sobre impacto na equipe', 'Quer inovação', 'Entusiasmado'];
        basePhases.test1.salesStrategy = 'Compartilhe a visão, crie entusiasmo conjunto';
        
        basePhases.operate.clientBehavior = 'Conversa com muitas pessoas, busca opiniões';
        basePhases.operate.detectedIndicators = ['Menciona outros fornecedores', 'Pede indicações', 'Quer conhecer a equipe'];
        basePhases.operate.salesStrategy = 'Ofereça testemunhos, apresente sua equipe';
        
        basePhases.test2.clientBehavior = 'Verifica reconhecimento e impacto social';
        basePhases.test2.detectedIndicators = ['Pergunta quem mais usa', 'Quer saber sobre suporte', 'Preocupado com imagem'];
        basePhases.test2.salesStrategy = 'Mostre clientes conhecidos, destaque comunidade';
        
        basePhases.exit.clientBehavior = 'Precisa se sentir bem com a decisão';
        basePhases.exit.detectedIndicators = ['Quer relacionamento', 'Preocupado com pós-venda', 'Emotivo'];
        basePhases.exit.salesStrategy = 'Celebre a parceria, prometa acompanhamento pessoal';
        break;

      case 'S':
        basePhases.test1.clientBehavior = 'Define objetivo com cautela, prioriza estabilidade';
        basePhases.test1.detectedIndicators = ['Pergunta sobre riscos', 'Preocupado com mudanças', 'Quer segurança'];
        basePhases.test1.salesStrategy = 'Ofereça garantias, minimize riscos percebidos';
        
        basePhases.operate.clientBehavior = 'Avalia lentamente, consulta pessoas de confiança';
        basePhases.operate.detectedIndicators = ['Precisa de tempo', 'Consulta cônjuge/sócio', 'Lê tudo'];
        basePhases.operate.salesStrategy = 'Dê tempo, forneça materiais para levar';
        
        basePhases.test2.clientBehavior = 'Verifica segurança e suporte contínuo';
        basePhases.test2.detectedIndicators = ['Pergunta muito sobre suporte', 'Quer conhecer processos', 'Testa paciência'];
        basePhases.test2.salesStrategy = 'Detalhe o suporte, mostre processos estáveis';
        
        basePhases.exit.clientBehavior = 'Precisa de segurança total para decidir';
        basePhases.exit.detectedIndicators = ['Pede mais garantias', 'Quer período teste', 'Hesitante'];
        basePhases.exit.salesStrategy = 'Ofereça trial, garantia estendida, suporte prioritário';
        break;

      case 'C':
        basePhases.test1.clientBehavior = 'Define objetivo com precisão, busca perfeição';
        basePhases.test1.detectedIndicators = ['Muitas perguntas técnicas', 'Quer especificações', 'Analítico'];
        basePhases.test1.salesStrategy = 'Prepare dados detalhados, seja preciso';
        
        basePhases.operate.clientBehavior = 'Pesquisa exaustivamente, compara tudo';
        basePhases.operate.detectedIndicators = ['Planilhas comparativas', 'Pergunta detalhes obscuros', 'Demora'];
        basePhases.operate.salesStrategy = 'Forneça white papers, estudos de caso detalhados';
        
        basePhases.test2.clientBehavior = 'Verifica qualidade e conformidade';
        basePhases.test2.detectedIndicators = ['Pede documentação', 'Verifica credenciais', 'Testa produto'];
        basePhases.test2.salesStrategy = 'Ofereça demo técnico, documentação completa';
        
        basePhases.exit.clientBehavior = 'Decide apenas quando tem certeza';
        basePhases.exit.detectedIndicators = ['Última rodada de perguntas', 'Negocia detalhes', 'Analisa contrato'];
        basePhases.exit.salesStrategy = 'Seja paciente, responda tudo por escrito';
        break;
    }

    return basePhases;
  }, [discProfile]);

  const addObservation = () => {
    if (!newObservation.trim()) return;

    setObservedBehaviors(prev => ({
      ...prev,
      [currentPhase]: [...(prev[currentPhase] || []), newObservation.trim()]
    }));
    setNewObservation('');
  };

  const getPhaseProgress = () => {
    const phases = ['test1', 'operate', 'test2', 'exit'];
    const currentIndex = phases.indexOf(currentPhase);
    return ((currentIndex + 1) / phases.length) * 100;
  };

  const getTotalObservations = () => {
    return Object.values(observedBehaviors).flat().length;
  };

  return (
    <Card className={cn("border-accent/30 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-accent" />
            TOTE Model Mapper
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-accent/20">
              DISC: {discProfile}
            </Badge>
            <Badge variant="outline" className="bg-secondary/20">
              {getTotalObservations()} obs.
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Mapeie a estratégia de decisão de {contact.firstName} (Test-Operate-Test-Exit)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso no Ciclo TOTE</span>
            <span>{Math.round(getPhaseProgress())}%</span>
          </div>
          <Progress value={getPhaseProgress()} className="h-2" />
        </div>

        {/* Phase Selector */}
        <div className="grid grid-cols-4 gap-1">
          {(['test1', 'operate', 'test2', 'exit'] as const).map((phase, idx) => {
            const phaseInfo = totePhases[phase];
            const hasObs = (observedBehaviors[phase] || []).length > 0;
            
            return (
              <button
                key={phase}
                onClick={() => setCurrentPhase(phase)}
                className={cn(
                  "p-2 rounded-lg border text-center transition-all relative",
                  currentPhase === phase 
                    ? 'bg-accent/20 border-accent/50' 
                    : 'bg-muted/30 border-transparent hover:bg-muted/50'
                )}
              >
                <div className={cn("flex justify-center mb-1", phaseInfo.color)}>
                  {phaseInfo.icon}
                </div>
                <div className="text-[10px] font-medium truncate">
                  {phase === 'test1' ? 'TEST 1' : phase === 'test2' ? 'TEST 2' : phase.toUpperCase()}
                </div>
                {hasObs && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full" />
                )}
                {idx < 3 && (
                  <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground z-10" />
                )}
              </button>
            );
          })}
        </div>

        {/* Current Phase Details */}
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/30 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className={totePhases[currentPhase].color}>
              {totePhases[currentPhase].icon}
            </span>
            <div>
              <h4 className="font-medium text-sm">{totePhases[currentPhase].name}</h4>
              <p className="text-xs text-muted-foreground">{totePhases[currentPhase].description}</p>
            </div>
          </div>

          {/* DISC-Adapted Behavior */}
          <div className="bg-accent/10 rounded p-2">
            <div className="text-xs text-accent font-medium mb-1">
              Comportamento típico de {discProfile}:
            </div>
            <p className="text-sm">{totePhases[currentPhase].clientBehavior}</p>
          </div>

          {/* Indicators to Watch */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Indicadores a Observar:</div>
            <div className="flex flex-wrap gap-1">
              {totePhases[currentPhase].detectedIndicators.map((ind, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {ind}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sales Strategy */}
          <div className="bg-success/10 rounded p-2">
            <div className="text-xs text-success font-medium mb-1">
              💡 Estratégia de Venda:
            </div>
            <p className="text-sm">{totePhases[currentPhase].salesStrategy}</p>
          </div>

          {/* Observation Input */}
          <div className="space-y-2">
            <div className="text-xs font-medium">Adicionar Observação:</div>
            <div className="flex gap-2">
              <Textarea
                placeholder={`O que ${contact.firstName} fez/disse nesta fase?`}
                value={newObservation}
                onChange={(e) => setNewObservation(e.target.value)}
                className="min-h-[60px] text-sm flex-1"
              />
            </div>
            <Button size="sm" onClick={addObservation} disabled={!newObservation.trim()}>
              <Plus className="h-3 w-3 mr-1" />
              Registrar Observação
            </Button>
          </div>

          {/* Recorded Observations */}
          {(observedBehaviors[currentPhase] || []).length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Observações Registradas:</div>
              {observedBehaviors[currentPhase].map((obs, idx) => (
                <div key={idx} className="text-xs bg-muted/50 rounded p-2 flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const phases = ['test1', 'operate', 'test2', 'exit'] as const;
              const idx = phases.indexOf(currentPhase);
              if (idx > 0) setCurrentPhase(phases[idx - 1]);
            }}
            disabled={currentPhase === 'test1'}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Fase Anterior
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              const phases = ['test1', 'operate', 'test2', 'exit'] as const;
              const idx = phases.indexOf(currentPhase);
              if (idx < phases.length - 1) setCurrentPhase(phases[idx + 1]);
            }}
            disabled={currentPhase === 'exit'}
          >
            Próxima Fase
            <Play className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Quick Insight */}
        <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
          <strong>💡 Insight TOTE:</strong> Clientes {discProfile} geralmente 
          {discProfile === 'D' ? ' passam rapidamente pelo ciclo e decidem baseados em resultados.' :
           discProfile === 'I' ? ' focam na fase OPERATE conversando com pessoas e buscam validação social no EXIT.' :
           discProfile === 'S' ? ' demoram em cada fase, especialmente TEST 2, verificando segurança.' :
           ' são meticulosos em todas as fases, especialmente OPERATE e TEST 2.'}
        </div>
      </CardContent>
    </Card>
  );
};

export default TOTEModelMapper;
