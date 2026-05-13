import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  ArrowRight,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { VAKType } from '@/types/vak';
import { getDominantVAK } from '@/lib/contact-utils';
import { toast } from '@/hooks/use-toast';
import { DEMO_CONTACT } from '@/domain/demoEntities';

interface SwishPattern {
  id: string;
  currentState: string;
  desiredState: string;
  triggerImage: string;
  resourceImage: string;
  script: string;
}

interface SwishPatternGeneratorProps {
  contact?: Contact;
  className?: string;
}

const COMMON_OBJECTIONS = [
  { current: 'Medo de decidir errado', desired: 'Confiança na escolha', trigger: 'Momento de assinar contrato', resource: 'Imagem de sucesso após a decisão' },
  { current: 'Preocupação com preço', desired: 'Foco no valor', trigger: 'Ver o número do investimento', resource: 'Visão dos resultados obtidos' },
  { current: 'Dúvida sobre funcionar', desired: 'Certeza do resultado', trigger: 'Pensando "e se não funcionar?"', resource: 'Cases de sucesso similares' },
  { current: 'Medo de mudança', desired: 'Entusiasmo pela evolução', trigger: 'Imaginar a transição', resource: 'Visão do futuro melhor' },
  { current: 'Procrastinação', desired: 'Ação imediata', trigger: 'Pensando "depois vejo isso"', resource: 'Consequências positivas de agir agora' }
];

const SwishPatternGenerator: React.FC<SwishPatternGeneratorProps> = ({
  contact: contactProp,
  className
}) => {
  const contact = contactProp || DEMO_CONTACT;
  const [patterns, setPatterns] = useState<SwishPattern[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [newPattern, setNewPattern] = useState({
    currentState: '',
    desiredState: '',
    triggerImage: '',
    resourceImage: ''
  });
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const vakType = getDominantVAK(contact) as VAKType || 'V';

  const generateScript = (pattern: Omit<SwishPattern, 'id' | 'script'>) => {
    const intro = vakType === 'V' 
      ? `${contact.firstName}, vou te guiar em uma visualização rápida...`
      : vakType === 'A'
      ? `${contact.firstName}, vou te guiar em um processo... ouça com atenção...`
      : `${contact.firstName}, vou te guiar em uma experiência... sinta cada passo...`;

    const step1 = vakType === 'V'
      ? `Primeiro, imagine aquele momento quando ${pattern.triggerImage}... veja essa imagem bem grande e brilhante na sua frente...`
      : vakType === 'A'
      ? `Primeiro, ouça o que você diz a si mesmo quando ${pattern.triggerImage}... escute essa voz bem clara...`
      : `Primeiro, sinta aquela sensação quando ${pattern.triggerImage}... deixe-a preencher seu corpo...`;

    const step2 = vakType === 'V'
      ? `Agora, no canto inferior direito, coloque uma pequena imagem de ${pattern.resourceImage}... você ${pattern.desiredState}...`
      : vakType === 'A'
      ? `Agora, no fundo, ouça uma voz suave dizendo que você ${pattern.desiredState}...`
      : `Agora, sinta uma sensação sutil de ${pattern.desiredState} começando a crescer...`;

    const step3 = vakType === 'V'
      ? `SWISH! Instantaneamente, a imagem pequena cresce e cobre completamente a imagem antiga... Ela se torna grande, brilhante e irresistível!`
      : vakType === 'A'
      ? `SWISH! A voz positiva aumenta e substitui completamente a voz antiga... Ouça como ela ecoa forte e confiante!`
      : `SWISH! A sensação positiva explode e domina todo seu corpo... Sinta como ela é poderosa!`;

    const step4 = `Abra os olhos... Limpe a tela mental... Agora pense novamente em ${pattern.triggerImage}... O que você ${vakType === 'V' ? 'vê' : vakType === 'A' ? 'ouve' : 'sente'} agora?`;

    const repeat = `Vamos repetir isso mais 5 vezes... mais rápido a cada vez... SWISH! SWISH! SWISH!`;

    return `${intro}\n\n${step1}\n\n${step2}\n\n${step3}\n\n${step4}\n\n${repeat}`;
  };

  const savePattern = () => {
    if (!newPattern.currentState || !newPattern.desiredState) return;

    const pattern: SwishPattern = {
      id: `swish-${Date.now()}`,
      ...newPattern,
      script: generateScript(newPattern)
    };

    setPatterns(prev => [...prev, pattern]);
    setNewPattern({ currentState: '', desiredState: '', triggerImage: '', resourceImage: '' });
    setCurrentStep(0);
  };

  const addFromSuggestion = (suggestion: typeof COMMON_OBJECTIONS[0]) => {
    const patternData = {
      currentState: suggestion.current,
      desiredState: suggestion.desired,
      triggerImage: suggestion.trigger,
      resourceImage: suggestion.resource
    };

    const pattern: SwishPattern = {
      id: `swish-${Date.now()}`,
      ...patternData,
      script: generateScript(patternData)
    };

    setPatterns(prev => [...prev, pattern]);
  };

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(script);
    setTimeout(() => setCopiedScript(null), 2000);
    toast({
      title: "Copiado!",
      description: "Script Swish Pattern copiado"
    });
  };

  const steps = [
    { title: 'Estado Atual', field: 'currentState', placeholder: 'O que o cliente quer mudar? Ex: Medo de decidir' },
    { title: 'Estado Desejado', field: 'desiredState', placeholder: 'Como ele quer se sentir? Ex: Confiante' },
    { title: 'Imagem Gatilho', field: 'triggerImage', placeholder: 'O que dispara o estado negativo? Ex: Pensar no contrato' },
    { title: 'Imagem Recurso', field: 'resourceImage', placeholder: 'Imagem do sucesso? Ex: Vendo os resultados' }
  ];

  return (
    <Card className={cn("border-success/30 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-success" />
            Swish Pattern Generator
          </CardTitle>
          <Badge variant="outline" className="bg-success/20">
            VAK: {vakType}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Gere padrões Swish personalizados para {contact.firstName} superar objeções internas
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Add from Suggestions */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Objeções Comuns (clique para adicionar):
          </div>
          <div className="flex flex-wrap gap-1">
            {COMMON_OBJECTIONS.filter(
              co => !patterns.some(p => p.currentState === co.current)
            ).slice(0, 4).map((obj, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => addFromSuggestion(obj)}
              >
                {obj.current}
              </Button>
            ))}
          </div>
        </div>

        {/* Pattern Builder */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-success" />
            Criar Novo Padrão Swish
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    currentStep === idx 
                      ? 'bg-success text-success-foreground' 
                      : newPattern[step.field as keyof typeof newPattern]
                      ? 'bg-success/30 text-success'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {newPattern[step.field as keyof typeof newPattern] ? '✓' : idx + 1}
                </button>
                {idx < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Input */}
          <div className="space-y-2">
            <div className="text-xs font-medium">{steps[currentStep].title}</div>
            <Input
              placeholder={steps[currentStep].placeholder}
              value={newPattern[steps[currentStep].field as keyof typeof newPattern]}
              onChange={(e) => setNewPattern(prev => ({
                ...prev,
                [steps[currentStep].field]: e.target.value
              }))}
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Anterior
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Próximo
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1"
                onClick={savePattern}
                disabled={!newPattern.currentState || !newPattern.desiredState}
              >
                <Play className="h-3 w-3 mr-1" />
                Gerar Script
              </Button>
            )}
          </div>
        </div>

        {/* Generated Patterns */}
        {patterns.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Padrões Gerados ({patterns.length})
            </div>

            <AnimatePresence>
              {patterns.map((pattern, idx) => (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-success/10 rounded-lg p-3 border border-success/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-destructive/20 text-destructive">
                        {pattern.currentState}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="bg-success/20 text-success">
                        {pattern.desiredState}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() => copyScript(pattern.script)}
                    >
                      {copiedScript === pattern.script ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  <div className="bg-background/50 rounded p-2 text-xs">
                    <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
                      {pattern.script}
                    </pre>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
          <div className="font-medium text-success mb-2">💡 Como Funciona o Swish Pattern</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Identifique o gatilho que dispara a objeção</li>
            <li>Crie uma imagem do estado desejado</li>
            <li>Coloque a imagem positiva pequena no canto</li>
            <li>SWISH! Faça a imagem positiva explodir e cobrir a negativa</li>
            <li>Repita 5-7 vezes em velocidade crescente</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default SwishPatternGenerator;
