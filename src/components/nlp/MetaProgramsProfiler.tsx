import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Compass, Zap, Workflow, Users, CheckCircle2 } from 'lucide-react';
import { Contact } from '@/types';

interface MetaProgramsProfilerProps {
  contact: Contact;
}

const MetaProgramsProfiler: React.FC<MetaProgramsProfilerProps> = ({ contact }) => {
  const getScore = (seed: string, offset: number) => {
    const combined = seed + offset;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 100);
  };

  const programs = [
    {
      id: 'direction',
      label: 'Direção de Motivação',
      left: 'Afastamento (Away From)',
      right: 'Aproximação (Toward)',
      score: getScore(contact.id, 1),
      description: 'Como o cliente se motiva: fugindo de problemas ou buscando objetivos.',
      icon: Target
    },
    {
      id: 'reference',
      label: 'Referência de Decisão',
      left: 'Externa (Feedback)',
      right: 'Interna (Self)',
      score: getScore(contact.id, 2),
      description: 'Onde o cliente busca validação: nele mesmo ou em opiniões externas.',
      icon: Users
    },
    {
      id: 'options',
      label: 'Foco de Ação',
      left: 'Procedimentos',
      right: 'Opções',
      score: getScore(contact.id, 3),
      description: 'Prefere seguir um passo-a-passo ou ter múltiplas alternativas.',
      icon: Workflow
    },
    {
      id: 'reaction',
      label: 'Tempo de Reação',
      left: 'Reativo (Analítico)',
      right: 'Proativo (Ação)',
      score: getScore(contact.id, 4),
      description: 'O cliente age imediatamente ou espera para analisar a situação.',
      icon: Zap
    },
    {
      id: 'comparison',
      label: 'Padrão de Comparação',
      left: 'Diferença (Novidade)',
      right: 'Semelhança (Estabilidade)',
      score: getScore(contact.id, 5),
      description: 'Busca o que é novo e diferente ou o que é familiar e seguro.',
      icon: Compass
    }
  ];

  const getStrategy = (program: typeof programs[0]) => {
    if (program.score > 60) {
      switch (program.id) {
        case 'direction': return 'Foque nos ganhos e benefícios futuros.';
        case 'reference': return 'Deixe-o sentir que a decisão é 100% dele.';
        case 'options': return 'Apresente 3-4 alternativas e deixe-o escolher.';
        case 'reaction': return 'Mantenha o ritmo acelerado e peça o fechamento agora.';
        case 'comparison': return 'Destaque como isso mantém a segurança do que ele já tem.';
        default: return '';
      }
    } else if (program.score < 40) {
      switch (program.id) {
        case 'direction': return 'Destaque os riscos de não fechar agora.';
        case 'reference': return 'Use depoimentos, cases e prova social externa.';
        case 'options': return 'Forneça um roadmap claro e estruturado de 5 passos.';
        case 'reaction': return 'Dê tempo para reflexão e forneça dados detalhados.';
        case 'comparison': return 'Enfatize o quão inovador e disruptivo isso é.';
        default: return '';
      }
    }
    return 'Use uma linguagem equilibrada (Ganhos + Segurança).';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Brain className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <CardTitle>Perfil de Metaprogramas: {contact.firstName}</CardTitle>
              <CardDescription>Mapeamento dos filtros subconscientes de processamento de informação.</CardDescription>
            </div>
          </CardHeader>
        </Card>

        {programs.map((program) => {
          const Icon = program.icon;
          return (
            <Card key={program.id} className="overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm uppercase tracking-wider">{program.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Score: {program.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground px-1">
                    <span>{program.left}</span>
                    <span>{program.right}</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 bg-primary transition-all duration-1000 ease-out"
                      style={{ 
                        left: program.score > 50 ? '50%' : `${program.score}%`,
                        right: program.score > 50 ? `${100 - program.score}%` : '50%'
                      }}
                    />
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-background z-10" />
                  </div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50 group-hover:bg-muted/50 transition-colors">
                  <p className="text-xs text-muted-foreground mb-2 italic">"{program.description}"</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                    <p className="text-xs font-medium">
                      <span className="text-primary">Estratégia:</span> {getStrategy(program)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MetaProgramsProfiler;