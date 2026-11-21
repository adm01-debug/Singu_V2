import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Compass, Zap, Workflow, Users, CheckCircle2 } from 'lucide-react';
import { Contact } from '@/types';

interface MetaProgramsProfilerProps {
  contact: Contact;
}

const MetaProgramsProfiler: React.FC<MetaProgramsProfilerProps> = ({ contact }) => {
  // Cada eixo de metaprograma é derivado de dados reais do contato (nunca
  // de hash do id nem de aleatório). Quando o contato não tem o dado, o
  // valor cai no meio da escala (sem tendência). Escala final: 0-100.
  const getScore = (key: 'direction' | 'reference' | 'options' | 'reaction' | 'comparison') => {
    const b = contact.behavior ?? ({} as Contact['behavior']);
    const dentro = (v: number | undefined, max: number) =>
      typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : null;

    switch (key) {
      case 'direction': {
        // Aproximação (Toward) quando há objetivo/profissional motivação explícita; Afastamento quando há receio/pressão.
        const tieneEast = (b.professionalGoals ?? '').length > 0 || (contact.interests ?? []).length > 0;
        const avoid = (b.primaryFear ?? '').length > 0;
        if (tieneEast && !avoid) return 75;
        if (avoid && !tieneEast) return 25;
        return 50;
      }
      case 'reference': {
        // Internal (Self) quando decide sozinho; External (Feedback) quando precisa de aprovação/consenso.
        const needsApproval = b.needsApproval;
        const criteria = (b.decisionCriteria ?? []).length;
        if (typeof needsApproval === 'boolean') return needsApproval ? 25 : 70;
        if (criteria > 0) return 45;
        return 50;
      }
      case 'options': {
        // Opções quando processo é rico/custom (tags/interesses); Procedimentos quando repetitivo/formal.
        const richness = (contact.tags ?? []).length + (contact.interests ?? []).length + (b.currentChallenges ?? []).length;
        return richness >= 5 ? 70 : richness >= 2 ? 55 : 50;
      }
      case 'reaction': {
        // Proativo quando responde rápido; Reativo quando decisão é lenta/analítica.
        const speed = b.decisionSpeed;
        const resp = dentro(b.avgResponseTimeHours, 168);
        const respScore = resp === null ? 50 : resp <= 24 ? 70 : resp <= 72 ? 50 : 35;
        if (speed === 'fast') return 70;
        if (speed === 'slow') return 35;
        return respScore;
      }
      case 'comparison': {
        // Semelhança (Estabilidade) quando alto suporte/força já estabelecidos; Diferença (Novidade) em carreira/desafio.
        const power = dentro(b.decisionPower, 10);
        const suporte = dentro(b.supportLevel, 10);
        const majority = (contact.relationshipScore ?? 0);
        const novelScore = (power ?? 5) * 10 + (suporte ?? 5) * 5;
        if (majority >= 60) return 40; // estabilidade preferida
        return novelScore >= 90 ? 70 : novelScore >= 55 ? 55 : 45;
      }
      default:
        return 50;
    }
  };

  const programs = [
    {
      id: 'direction',
      label: 'Direção de Motivação',
      left: 'Afastamento (Away From)',
      right: 'Aproximação (Toward)',
      score: getScore('direction'),
      description: 'Como o cliente se motiva: fugindo de problemas ou buscando objetivos.',
      icon: Target
    },
    {
      id: 'reference',
      label: 'Referência de Decisão',
      left: 'Externa (Feedback)',
      right: 'Interna (Self)',
      score: getScore('reference'),
      description: 'Onde o cliente busca validação: nele mesmo ou em opiniões externas.',
      icon: Users
    },
    {
      id: 'options',
      label: 'Foco de Ação',
      left: 'Procedimentos',
      right: 'Opções',
      score: getScore('options'),
      description: 'Prefere seguir um passo-a-passo ou ter múltiplas alternativas.',
      icon: Workflow
    },
    {
      id: 'reaction',
      label: 'Tempo de Reação',
      left: 'Reativo (Analítico)',
      right: 'Proativo (Ação)',
      score: getScore('reaction'),
      description: 'O cliente age imediatamente ou espera para analisar a situação.',
      icon: Zap
    },
    {
      id: 'comparison',
      label: 'Padrão de Comparação',
      left: 'Diferença (Novidade)',
      right: 'Semelhança (Estabilidade)',
      score: getScore('comparison'),
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