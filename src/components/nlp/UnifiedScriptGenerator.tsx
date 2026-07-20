// ==============================================
// Unified Script Generator - Multi-Profile Sales Scripts
// Combines VAK + DISC + Metaprograms + EQ into one script
// Enterprise Level Component
// ==============================================

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Copy, Check, AlertTriangle,
  ChevronRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Contact, DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAK_LABELS, VAK_COMMUNICATION_TIPS } from '@/types/vak';
import { METAPROGRAM_LABELS } from '@/types/metaprograms';
import { SalesStage } from '@/types/nlp-advanced';
import { POWER_WORDS, SALES_STAGE_INFO } from '@/data/nlpAdvancedData';
import { getDominantVAK, getDISCProfile, getMetaprogramProfile, getContactBehavior } from '@/lib/contact-utils';

interface UnifiedScriptGeneratorProps {
  contact: Contact;
  className?: string;
}

interface ScriptSection {
  stage: SalesStage;
  title: string;
  script: string;
  powerWords: string[];
  wordsToAvoid: string[];
  tips: string[];
  duration: string;
  nextAction: string;
}

type ScriptStyle = 'aggressive' | 'consultative' | 'relationship';

const UnifiedScriptGenerator: React.FC<UnifiedScriptGeneratorProps> = ({
  contact,
  className
}) => {
  const [activeStage, setActiveStage] = useState<SalesStage>('rapport');
  const [scriptStyle, setScriptStyle] = useState<ScriptStyle>('consultative');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Get all profiles
  const vakType = getDominantVAK(contact) as VAKType || 'V';
  const discProfile = (getDISCProfile(contact) as DISCProfile) || 'D';
  const metaProfile = getMetaprogramProfile(contact);
  const behavior = getContactBehavior(contact);
  const motivationDirection = metaProfile?.motivationDirection || 'toward';

  // Generate unified power words
  const powerWords = useMemo(() => {
    const vakWords = POWER_WORDS.vak[vakType] || [];
    const discWords = POWER_WORDS.disc[discProfile] || [];
    const metaWords = POWER_WORDS.metaprograms[motivationDirection] || [];
    
    return [...new Set([...vakWords.slice(0, 4), ...discWords.slice(0, 4), ...metaWords.slice(0, 4)])];
  }, [vakType, discProfile, motivationDirection]);

  // Generate words to avoid
  const wordsToAvoid = useMemo(() => {
    const wrongVak = (['V', 'A', 'K', 'D'] as VAKType[]).filter(t => t !== vakType);
    const wrongMeta = motivationDirection === 'toward' ? 'away_from' : 'toward';
    
    return [
      ...(VAK_COMMUNICATION_TIPS[wrongVak[0]]?.useWords.slice(0, 2) || []),
      ...(POWER_WORDS.metaprograms[wrongMeta]?.slice(0, 2) || [])
    ];
  }, [vakType, motivationDirection]);

  // Generate scripts for each stage
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const generateScript = (stage: SalesStage): ScriptSection => {
    const stageInfo = SALES_STAGE_INFO[stage];
    const firstName = contact.firstName;

    const scripts: Record<SalesStage, Record<ScriptStyle, string>> = {
      rapport: {
        aggressive: `${firstName}, vou ser direto com você. ${discProfile === 'D' ? 'Sei que você valoriza resultados.' : discProfile === 'I' ? 'Sei que você curte conversas dinâmicas!' : discProfile === 'S' ? 'Quero garantir que você se sinta confortável.' : 'Trouxe os dados que você precisa.'}`,
        consultative: `${firstName}, ${vakType === 'V' ? 'é um prazer te ver hoje.' : vakType === 'A' ? 'que bom poder conversar.' : vakType === 'K' ? 'fico feliz em estar conectado com você.' : 'vamos estruturar nossa conversa.'} Como ${motivationDirection === 'toward' ? 'estão as conquistas' : 'está a situação'} por aí?`,
        relationship: `${firstName}! ${vakType === 'K' ? 'Sinto que vamos ter uma ótima conversa hoje.' : 'Estava pensando em você.'} Como vai ${behavior?.currentPressure ? 'a pressão no trabalho' : 'tudo'}?`
      },
      discovery: {
        aggressive: `${firstName}, ${motivationDirection === 'toward' ? 'qual é o seu maior objetivo agora?' : 'qual é o maior problema que você precisa resolver?'} ${discProfile === 'D' ? 'Seja direto.' : ''}`,
        consultative: `${firstName}, ${vakType === 'V' ? 'me mostra' : vakType === 'A' ? 'me conta' : vakType === 'K' ? 'me ajuda a sentir' : 'me explica'} ${motivationDirection === 'toward' ? 'o que você quer alcançar' : 'o que está te impedindo de avançar'}. ${metaProfile?.referenceFrame === 'external' ? 'O que sua equipe espera?' : 'O que você considera mais importante?'}`,
        relationship: `${firstName}, quero ${vakType === 'K' ? 'entender de verdade' : 'conhecer melhor'} sua situação. ${motivationDirection === 'toward' ? 'Quais são seus sonhos para esse projeto?' : 'O que mais te preocupa hoje?'}`
      },
      presentation: {
        aggressive: `${firstName}, ${vakType === 'V' ? 'olha isso:' : vakType === 'A' ? 'escuta só:' : vakType === 'K' ? 'sente isso:' : 'analisa comigo:'} nossa solução ${motivationDirection === 'toward' ? 'vai te levar a ' + (behavior?.professionalGoals?.[0] || 'resultados incríveis') : 'vai eliminar ' + (behavior?.currentChallenges?.[0] || 'seus problemas atuais')}.`,
        consultative: `${firstName}, baseado no que você ${vakType === 'A' ? 'me contou' : vakType === 'V' ? 'me mostrou' : 'compartilhou'}, ${vakType === 'V' ? 'vou te mostrar' : vakType === 'A' ? 'vou te explicar' : vakType === 'K' ? 'vou te guiar' : 'vou apresentar'} como podemos ${motivationDirection === 'toward' ? 'alcançar' : 'resolver'} isso.`,
        relationship: `${firstName}, ${vakType === 'K' ? 'quero que você sinta segurança' : 'quero que você tenha clareza'} sobre como podemos ${motivationDirection === 'toward' ? 'construir esse sucesso juntos' : 'superar esses desafios como parceiros'}.`
      },
      objection_handling: {
        aggressive: `${firstName}, ${discProfile === 'D' ? 'entendo sua preocupação, mas olha os fatos:' : 'vou ser honesto:'} ${motivationDirection === 'toward' ? 'você está a um passo de conquistar o que quer' : 'cada dia que passa é prejuízo'}.`,
        consultative: `${firstName}, ${vakType === 'K' ? 'entendo como você se sente.' : vakType === 'A' ? 'ouço sua preocupação.' : 'vejo seu ponto.'} ${metaProfile?.referenceFrame === 'external' ? 'Outros clientes tinham a mesma dúvida e hoje são nossos maiores cases.' : 'Me conta mais sobre o que te leva a pensar assim.'}`,
        relationship: `${firstName}, sua preocupação ${vakType === 'K' ? 'é totalmente válida. Vou te dar a segurança que precisa.' : 'faz sentido. Vamos resolver isso juntos.'}`
      },
      negotiation: {
        aggressive: `${firstName}, ${discProfile === 'D' ? 'vamos fechar:' : 'proposta final:'} ${motivationDirection === 'toward' ? 'isso vai multiplicar seus resultados' : 'isso vai eliminar suas dores'}.`,
        consultative: `${firstName}, ${vakType === 'V' ? 'olhando' : vakType === 'A' ? 'considerando' : vakType === 'K' ? 'sentindo' : 'analisando'} tudo que conversamos, tenho a proposta ideal para você.`,
        relationship: `${firstName}, ${vakType === 'K' ? 'quero que você se sinta confortável' : 'quero que seja uma decisão tranquila'}. ${motivationDirection === 'toward' ? 'Vamos construir algo que te leve onde você quer chegar.' : 'Vamos resolver isso de forma definitiva.'}`
      },
      closing: {
        aggressive: `${firstName}, ${discProfile === 'D' ? 'vamos fechar agora?' : discProfile === 'I' ? 'vamos fazer isso acontecer?' : discProfile === 'S' ? 'posso contar com você?' : 'faz sentido avançar?'} ${motivationDirection === 'toward' ? 'Cada dia conta para alcançar sua meta.' : 'Quanto mais esperar, mais perde.'}`,
        consultative: `${firstName}, ${vakType === 'V' ? 'consegue visualizar' : vakType === 'A' ? 'faz sentido' : vakType === 'K' ? 'se sente confortável' : 'a lógica é clara'} para avançarmos?`,
        relationship: `${firstName}, ${vakType === 'K' ? 'sinto que estamos alinhados.' : 'parece que faz sentido.'} ${motivationDirection === 'toward' ? 'Quer dar esse passo juntos?' : 'Quer resolver isso de vez?'}`
      },
      follow_up: {
        aggressive: `${firstName}, ${discProfile === 'D' ? 'passando para confirmar próximos passos.' : 'só confirmando:'} ${motivationDirection === 'toward' ? 'Estamos no caminho do sucesso!' : 'Problema resolvido!'}`,
        consultative: `${firstName}, ${vakType === 'A' ? 'queria conversar' : vakType === 'V' ? 'queria checar' : 'queria verificar'} como está sua experiência. ${metaProfile?.referenceFrame === 'external' ? 'Sua equipe está satisfeita?' : 'Está atendendo suas expectativas?'}`,
        relationship: `${firstName}! ${vakType === 'K' ? 'Estava pensando em você.' : 'Passando para saber'} como estão as coisas. ${motivationDirection === 'toward' ? 'Já alcançou algum resultado?' : 'Tudo resolvido?'}`
      }
    };

    return {
      stage,
      title: stageInfo.name,
      script: scripts[stage][scriptStyle],
      powerWords: powerWords.slice(0, 5),
      wordsToAvoid: wordsToAvoid.slice(0, 4),
      tips: stageInfo.keyActions,
      duration: stageInfo.duration,
      nextAction: stageInfo.transitionSignals[0]
    };
  };

  const currentScript = generateScript(activeStage);
  const allScripts = (['rapport', 'discovery', 'presentation', 'objection_handling', 'negotiation', 'closing', 'follow_up'] as SalesStage[]).map(generateScript);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
    toast.success('Script copiado!');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Script Unificado de Vendas
            </CardTitle>
            <CardDescription>
              Personalizado para {contact.firstName}: {VAK_LABELS[vakType]?.name} • {DISC_LABELS[discProfile]?.name} • {METAPROGRAM_LABELS.motivationDirection[motivationDirection]?.name}
            </CardDescription>
          </div>
          <Select value={scriptStyle} onValueChange={(v) => setScriptStyle(v as ScriptStyle)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aggressive">Agressivo</SelectItem>
              <SelectItem value="consultative">Consultivo</SelectItem>
              <SelectItem value="relationship">Relacional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profile Summary */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className={cn(VAK_LABELS[vakType]?.bgColor)}>
            {VAK_LABELS[vakType]?.icon} {VAK_LABELS[vakType]?.name}
          </Badge>
          <Badge variant="outline" className={cn(DISC_LABELS[discProfile]?.color)}>
            {discProfile} - {DISC_LABELS[discProfile]?.name}
          </Badge>
          <Badge variant="outline">
            {METAPROGRAM_LABELS.motivationDirection[motivationDirection]?.icon} {METAPROGRAM_LABELS.motivationDirection[motivationDirection]?.name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stage Navigation */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {(['rapport', 'discovery', 'presentation', 'objection_handling', 'negotiation', 'closing', 'follow_up'] as SalesStage[]).map((stage, idx) => {
              const info = SALES_STAGE_INFO[stage];
              return (
                <Button
                  key={stage}
                  size="sm"
                  variant={activeStage === stage ? 'default' : 'outline'}
                  onClick={() => setActiveStage(stage)}
                  className="gap-1 whitespace-nowrap"
                >
                  <span>{info.icon}</span>
                  {info.name}
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Current Stage Script */}
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{SALES_STAGE_INFO[activeStage].icon}</span>
                <div>
                  <h4 className="font-semibold">{currentScript.title}</h4>
                  <p className="text-xs text-muted-foreground">{currentScript.duration}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentScript.script, activeStage)}
                className="gap-1"
              >
                {copiedSection === activeStage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary mb-4">
              <p className="text-foreground leading-relaxed">{currentScript.script}</p>
            </div>

            {/* Power Words */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-success" />
                  Use estas palavras:
                </h5>
                <div className="flex flex-wrap gap-1">
                  {currentScript.powerWords.map(word => (
                    <Badge key={word} variant="secondary" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-warning" />
                  Evite:
                </h5>
                <div className="flex flex-wrap gap-1">
                  {currentScript.wordsToAvoid.map(word => (
                    <Badge key={word} variant="outline" className="text-xs line-through opacity-60">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Tips */}
            <div>
              <h5 className="text-sm font-medium mb-2">Dicas para esta etapa:</h5>
              <ul className="space-y-1">
                {currentScript.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Full Script View */}
          <Tabs defaultValue="full">
            <TabsList className="w-full">
              <TabsTrigger value="full" className="flex-1">Script Completo</TabsTrigger>
            </TabsList>
            <TabsContent value="full" className="mt-2">
              <ScrollArea className="h-64 rounded-lg border p-4">
                {allScripts.map((script, idx) => (
                  <div key={script.stage} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{SALES_STAGE_INFO[script.stage].icon}</span>
                      <h5 className="font-medium">{script.title}</h5>
                      <Badge variant="outline" className="text-xs">{script.duration}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 border-l-2 border-muted">
                      {script.script}
                    </p>
                    {idx < allScripts.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default UnifiedScriptGenerator;
