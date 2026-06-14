// ==============================================
// DISC Sales Script Generator - Dynamic Scripts
// Enterprise Level Component
// ==============================================

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Copy, Download, Sparkles, Target,
  MessageSquare, AlertTriangle, CheckCircle, Zap,
  ChevronRight, Volume2, Eye, Hand, Brain
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Contact, DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import { getDominantVAK, getDISCProfile } from '@/lib/contact-utils';

interface SalesStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  script: string;
  tips: string[];
  magicWords: string[];
  warnings: string[];
}

interface DISCSalesScriptGeneratorProps {
  contact: Contact;
}

const DISCSalesScriptGenerator: React.FC<DISCSalesScriptGeneratorProps> = ({ contact }) => {
  const { toast } = useToast();
  const [activeStage, setActiveStage] = useState('opening');
  
  const discProfile = (getDISCProfile(contact) || 'I') as Exclude<DISCProfile, null>;
  const vakType = (getDominantVAK(contact) || 'V') as VAKType;
  const profileInfo = DISC_PROFILES[discProfile];
  const firstName = contact.firstName;

  const vakWords = useMemo(() => {
    switch (vakType) {
      case 'V':
        return { verb: 'veja', words: ['visualize', 'claro', 'perspectiva', 'olhe', 'imagine'] };
      case 'A':
        return { verb: 'ouça', words: ['escute', 'harmonia', 'soa bem', 'conversar', 'ressoar'] };
      case 'K':
        return { verb: 'sinta', words: ['toque', 'concreto', 'experiência', 'conexão', 'impacto'] };
      default:
        return { verb: 'analise', words: ['lógico', 'dados', 'processo', 'sentido', 'considere'] };
    }
  }, [vakType]);

  const salesStages: SalesStage[] = useMemo(() => [
    {
      id: 'opening',
      name: 'Abertura',
      icon: <MessageSquare className="w-4 h-4" />,
      script: discProfile === 'D'
        ? `"${firstName}, vou ser direto porque sei que você valoriza seu tempo. Tenho uma solução que pode impactar seus resultados em [PERÍODO]. Posso te mostrar em 5 minutos?"`
        : discProfile === 'I'
        ? `"${firstName}! Que bom finalmente conversarmos! Estou muito animado para compartilhar algo que acho que você vai adorar. Está pronto para uma novidade incrível?"`
        : discProfile === 'S'
        ? `"${firstName}, espero que esteja tendo um ótimo dia. Quero que se sinta à vontade. Preparei algo especialmente pensando em como posso te ajudar com tranquilidade."`
        : `"${firstName}, preparei uma análise detalhada com dados específicos para sua situação. Posso compartilhar as informações técnicas que levantei?"`,
      tips: [
        discProfile === 'D' ? 'Seja conciso - máximo 30 segundos de introdução' : 
        discProfile === 'I' ? 'Comece com energia e entusiasmo genuíno' :
        discProfile === 'S' ? 'Crie ambiente acolhedor antes de avançar' :
        'Mostre que você fez pesquisa prévia',
        `Use predicados ${vakType === 'V' ? 'visuais' : vakType === 'A' ? 'auditivos' : vakType === 'K' ? 'cinestésicos' : 'digitais'} desde o início`
      ],
      magicWords: profileInfo?.powerWords?.slice(0, 5) || [],
      warnings: profileInfo?.avoidWords?.slice(0, 3) || []
    },
    {
      id: 'discovery',
      name: 'Descoberta',
      icon: <Target className="w-4 h-4" />,
      script: `"${firstName}, para eu ${vakWords.verb} a melhor forma de te ajudar, preciso entender algumas coisas:\n\n` +
        `• ${discProfile === 'D' ? 'Qual resultado você quer alcançar?' : 
             discProfile === 'I' ? 'O que te deixaria mais empolgado?' :
             discProfile === 'S' ? 'O que te traria mais segurança?' :
             'Quais dados você está analisando atualmente?'}\n\n` +
        `• O que seria um sucesso para você nesse projeto?\n\n` +
        `• ${discProfile === 'D' || discProfile === 'C' ? 'Qual é o prazo?' : 'Como você imagina isso funcionando?'}"`,
      tips: [
        discProfile === 'D' ? 'Perguntas diretas e objetivas' :
        discProfile === 'I' ? 'Deixe ele falar e conte histórias' :
        discProfile === 'S' ? 'Pergunte sobre preocupações e receios' :
        'Pergunte sobre processos e métricas atuais',
        'Ouça mais do que fala (proporção 70/30)'
      ],
      magicWords: ['me conta', 'me ajuda a entender', 'o que mais importa', 'seu objetivo'],
      warnings: ['interromper', 'assumir', 'pular etapas']
    },
    {
      id: 'presentation',
      name: 'Apresentação',
      icon: <Sparkles className="w-4 h-4" />,
      script: `"${firstName}, baseado em tudo que você me ${vakType === 'A' ? 'contou' : 'mostrou'}, ${vakWords.verb} como [SOLUÇÃO] vai resolver [PROBLEMA DESCOBERTO]:\n\n` +
        `${discProfile === 'D' ? '📊 O resultado: [NÚMERO/ROI ESPECÍFICO] em [PRAZO]' :
           discProfile === 'I' ? '🌟 Imagine seu time comemorando quando [BENEFÍCIO EMOCIONAL]' :
           discProfile === 'S' ? '🔒 Você terá todo suporte necessário para [SEGURANÇA]' :
           '📋 Os dados mostram: [ESTATÍSTICA/BENCHMARK]'}\n\n` +
        `${discProfile !== 'D' ? 'Clientes como [REFERÊNCIA] conseguiram [RESULTADO ESPECÍFICO].' : ''}"`,
      tips: [
        discProfile === 'D' ? 'Foque em resultados e ROI' :
        discProfile === 'I' ? 'Conte casos de sucesso com emoção' :
        discProfile === 'S' ? 'Enfatize suporte e estabilidade' :
        'Apresente dados e comparativos',
        `Use ${vakType === 'V' ? 'slides visuais impactantes' : 
               vakType === 'A' ? 'explicações verbais claras' : 
               vakType === 'K' ? 'demonstrações práticas' : 
               'documentação técnica detalhada'}`
      ],
      magicWords: profileInfo?.powerWords?.slice(5, 10) || [],
      warnings: ['ser genérico', 'falar demais sobre você', 'ignorar objeções sutis']
    },
    {
      id: 'objection',
      name: 'Objeções',
      icon: <AlertTriangle className="w-4 h-4" />,
      script: `"${firstName}, entendo sua preocupação sobre [OBJEÇÃO]. É uma dúvida válida.\n\n` +
        `${discProfile === 'D' ? 'Vou ser direto: [RESPOSTA COM FATOS]' :
           discProfile === 'I' ? 'Deixa eu te contar sobre um cliente que tinha a mesma dúvida...' :
           discProfile === 'S' ? 'Totalmente compreensível. Vou te mostrar como garantimos [SEGURANÇA]...' :
           'Os dados mostram que [EVIDÊNCIA]. Posso detalhar a análise?'}\n\n` +
        `Isso esclarece sua dúvida?"`,
      tips: [
        'Use a técnica "Sinta, Sentiu, Descobriu" para S e I',
        discProfile === 'D' ? 'Não se desculpe - seja confiante' :
        discProfile === 'C' ? 'Tenha dados e provas prontos' :
        'Valide a emoção antes de responder',
        'Pergunte "essa era sua única preocupação?"'
      ],
      magicWords: ['entendo', 'justamente por isso', 'é exatamente por isso', 'outros clientes'],
      warnings: ['discordar diretamente', 'minimizar a preocupação', 'ser defensivo']
    },
    {
      id: 'closing',
      name: 'Fechamento',
      icon: <CheckCircle className="w-4 h-4" />,
      script: discProfile === 'D'
        ? `"${firstName}, vamos fechar. Baseado no que conversamos, faz sentido prosseguir. Qual forma de pagamento prefere?"`
        : discProfile === 'I'
        ? `"${firstName}, estou animado para começar essa parceria! Imagine os resultados já na próxima semana. Vamos oficializar?"`
        : discProfile === 'S'
        ? `"${firstName}, vou te dar todo o suporte que você precisa. Podemos começar devagar e ajustar no caminho. Fechamos?"`
        : `"${firstName}, analisando todos os pontos que discutimos, os dados indicam que faz sentido prosseguir. Posso enviar a documentação formal?"`,
      tips: [
        discProfile === 'D' ? 'Seja assertivo - não pergunte, afirme' :
        discProfile === 'I' ? 'Crie visão de futuro empolgante' :
        discProfile === 'S' ? 'Ofereça garantias e suporte contínuo' :
        'Recapitule os pontos-chave logicamente',
        'Use alternativa de escolha: "Prefere A ou B?"'
      ],
      magicWords: ['vamos começar', 'próximo passo', 'quando podemos', 'você prefere'],
      warnings: ['hesitar', 'dar opção de "pensar mais"', 'mostrar insegurança']
    },
    {
      id: 'followup',
      name: 'Follow-up',
      icon: <Zap className="w-4 h-4" />,
      script: `"${firstName}, como está sua experiência com [SOLUÇÃO]?\n\n` +
        `${discProfile === 'D' ? 'Quais resultados você já alcançou?' :
           discProfile === 'I' ? 'Está curtindo? Quem mais poderia se beneficiar?' :
           discProfile === 'S' ? 'Tem alguma dúvida ou precisa de suporte adicional?' :
           'Os números estão de acordo com o esperado?'}\n\n` +
        `Aliás, você conhece alguém que também poderia ${vakWords.verb} esses resultados?"`,
      tips: [
        discProfile === 'I' ? 'Peça indicações - eles adoram ajudar' :
        discProfile === 'S' ? 'Reforce o suporte contínuo disponível' :
        'Colete feedback para melhorar',
        'Documente resultados para usar como prova social'
      ],
      magicWords: ['satisfeito', 'resultados', 'indicação', 'feedback', 'próximos passos'],
      warnings: ['ser esquecido', 'não acompanhar', 'só aparecer para vender mais']
    }
  ], [discProfile, vakType, firstName, vakWords, profileInfo]);

  const currentStage = salesStages.find(s => s.id === activeStage) || salesStages[0];

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: '📋 Copiado!',
      description: 'Script copiado para a área de transferência'
    });
  };

  const exportScript = () => {
    const fullScript = salesStages.map(stage => {
      const tipsList = stage.tips.map(t => `- ${t}`).join('\n');
      return `## ${stage.name}\n\n${stage.script}\n\n### Dicas:\n${tipsList}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([fullScript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${contact.firstName}-${discProfile}.md`;
    a.click();
    
    toast({
      title: '📥 Exportado!',
      description: 'Script completo baixado em Markdown'
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Script de Vendas Personalizado</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: profileInfo?.color?.bg, color: profileInfo?.color?.text }}>
              {discProfile}
            </Badge>
            <Badge variant="outline" className="gap-1">
              {vakType === 'V' ? <Eye className="w-3 h-3" /> : 
               vakType === 'A' ? <Volume2 className="w-3 h-3" /> : 
               vakType === 'K' ? <Hand className="w-3 h-3" /> : 
               <Brain className="w-3 h-3" />}
              {vakType}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Script adaptado para {firstName} ({profileInfo?.name || discProfile})
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stage Navigation */}
        <Tabs value={activeStage} onValueChange={setActiveStage}>
          <TabsList className="w-full grid grid-cols-6">
            {salesStages.map(stage => (
              <TabsTrigger 
                key={stage.id} 
                value={stage.id}
                className="flex items-center gap-1 text-xs"
              >
                {stage.icon}
                <span className="hidden md:inline">{stage.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Current Stage Content */}
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Script */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                {currentStage.icon}
                {currentStage.name}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentStage.script)}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </Button>
            </div>
            <div className="bg-background rounded-lg p-4 border whitespace-pre-line text-sm">
              {currentStage.script}
            </div>
          </div>

          {/* Tips and Magic Words */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Tips */}
            <div className="bg-success/10 rounded-lg p-4">
              <h4 className="font-medium text-success dark:text-success mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Dicas para Esta Etapa
              </h4>
              <ul className="space-y-1.5">
                {currentStage.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-1 text-success" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Magic Words */}
            <div className="bg-primary/10 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Palavras Mágicas
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentStage.magicWords.map((word, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => copyToClipboard(word)}
                  >
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {currentStage.warnings.length > 0 && (
            <div className="bg-destructive/10 rounded-lg p-4">
              <h4 className="font-medium text-destructive dark:text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Evitar
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentStage.warnings.map((warning, idx) => (
                  <Badge key={idx} variant="outline" className="border-destructive/50 text-destructive dark:text-destructive">
                    ✕ {warning}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <Separator />

        {/* Export */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={exportScript} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar Script Completo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DISCSalesScriptGenerator;
