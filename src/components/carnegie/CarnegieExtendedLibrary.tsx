// ==============================================
// CARNEGIE EXTENDED LIBRARY
// Biblioteca consultavel das 10 metodologias Carnegie
// que existiam apenas como dados sem tela.
// ==============================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { EAGER_WANTS } from '@/data/carnegieEagerWant';
import { EMPATHY_TEMPLATES } from '@/data/carnegieEmpathyTemplates';
import { ENCOURAGEMENT_TEMPLATES } from '@/data/carnegieEncouragement';
import { INTEREST_TECHNIQUES } from '@/data/carnegieGenuineInterest';
import { OWNERSHIP_TECHNIQUES } from '@/data/carnegieOwnershipTransfer';
import { ORDER_TO_QUESTION } from '@/data/carnegieQuestionInfluence';
import { STORY_TEMPLATES } from '@/data/carnegieStorytelling';
import { IDEAL_TALK_RATIOS } from '@/data/carnegieTalkRatio';
import { YES_LADDER_TEMPLATES } from '@/data/carnegieYesLadder';
import { CRITICAL_PATTERNS } from '@/data/carnegieCriticismDetector';

interface LibraryItem {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
}

interface Library {
  id: string;
  label: string;
  hint: string;
  items: LibraryItem[];
}

const LIBRARIES: Library[] = [
  {
    id: 'eager_want',
    label: 'Desejos Ardentes',
    hint: 'Os 8 desejos profundos e como ativa-los',
    items: EAGER_WANTS.map((w) => ({
      id: w.id,
      title: w.name,
      subtitle: w.category,
      body: [
        w.description,
        ...w.arousalTechniques.map((t) => `• ${t.technique}\n  Exemplo: ${t.example}\n  Quando: ${t.whenToUse}`),
      ].join('\n\n'),
    })),
  },
  {
    id: 'empathy',
    label: 'Empatia',
    hint: 'Templates de validacao, espelhamento e suporte',
    items: EMPATHY_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.name,
      subtitle: t.type,
      body: [t.structure, ...t.examples, `Quando usar: ${t.whenToUse.join(' / ')}`].join('\n\n'),
    })),
  },
  {
    id: 'encouragement',
    label: 'Encorajamento',
    hint: 'Reduzir dificuldade percebida e elevar confianca',
    items: ENCOURAGEMENT_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.context,
      subtitle: t.encouragePhrase,
      body: t.fullScript,
    })),
  },
  {
    id: 'interest',
    label: 'Interesse Genuino',
    hint: 'Tecnicas por fase da conversa',
    items: Object.entries(INTEREST_TECHNIQUES).flatMap(([phase, techniques]) =>
      techniques.map((t, i) => ({
        id: `${phase}-${i}`,
        title: t.technique,
        subtitle: phase,
        body: t.examples.map((e) => `• ${e}`).join('\n'),
      })),
    ),
  },
  {
    id: 'ownership',
    label: 'Transferencia de Ideia',
    hint: 'Fazer o cliente acreditar que a ideia e dele',
    items: OWNERSHIP_TECHNIQUES.map((t) => ({
      id: t.id,
      title: t.name,
      subtitle: t.description,
      body: t.fullScript,
    })),
  },
  {
    id: 'question',
    label: 'Perguntas em vez de Ordens',
    hint: 'Preserva autonomia mantendo a direcao',
    items: ORDER_TO_QUESTION.map((q) => ({
      id: q.id,
      title: q.directOrder,
      subtitle: q.category,
      body: `Pergunta: ${q.questionAlternative}\n\nEfeito: ${q.effect}`,
    })),
  },
  {
    id: 'storytelling',
    label: 'Storytelling',
    hint: '7 estruturas narrativas com exemplo',
    items: STORY_TEMPLATES.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.type,
      body: [
        `Hook: ${s.structure.hook}`,
        `Conflito: ${s.structure.conflict}`,
        `Jornada: ${s.structure.journey}`,
        `Resolucao: ${s.structure.resolution}`,
        `Licao: ${s.structure.lesson}`,
        `Exemplo:\n${s.example}`,
      ].join('\n\n'),
    })),
  },
  {
    id: 'talk_ratio',
    label: 'Talk Ratio',
    hint: 'Quanto falar e quanto ouvir em cada fase',
    items: Object.entries(IDEAL_TALK_RATIOS).map(([key, r]) => ({
      id: key,
      title: r.name,
      subtitle: `Falar ${r.speakerIdeal}% / Ouvir ${r.listenerIdeal}%`,
      body: r.description,
    })),
  },
  {
    id: 'yes_ladder',
    label: 'Escada do Sim',
    hint: 'Sequencia de perguntas que constroem acordo',
    items: YES_LADDER_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.name,
      subtitle: t.context,
      body: [
        ...t.steps.map((s) => `${s.stepNumber}. ${s.question}\n   Objetivo: ${s.purpose}`),
        `Fechamento: ${t.finalAsk}`,
      ].join('\n\n'),
    })),
  },
  {
    id: 'criticism',
    label: 'Critica sem Ofensa',
    hint: 'Padroes a evitar e a alternativa positiva',
    items: Object.entries(CRITICAL_PATTERNS).map(([key, p]) => ({
      id: key,
      title: p.name,
      subtitle: `Severidade ${p.severity}`,
      body: [p.description, ...p.examples.map((e) => `Evitar: ${e}`)].join('\n\n'),
    })),
  },
];

export function CarnegieExtendedLibrary({ className }: { className?: string }) {
  const [libraryId, setLibraryId] = useState<string>('eager_want');
  const library = useMemo(
    () => LIBRARIES.find((l) => l.id === libraryId) ?? LIBRARIES[0],
    [libraryId],
  );

  const copy = async (item: LibraryItem) => {
    try {
      await navigator.clipboard.writeText(`${item.title}\n\n${item.body}`);
      toast.success('Conteudo copiado');
    } catch {
      toast.error('Nao foi possivel copiar');
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-4 w-4" />
              Bibliotecas Carnegie
            </CardTitle>
            <CardDescription>{library.hint}</CardDescription>
          </div>
          <Select value={libraryId} onValueChange={setLibraryId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIBRARIES.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[420px] pr-3">
          <div className="space-y-3">
            {library.items.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.subtitle && (
                      <Badge variant="outline" className="mt-1 text-xs">{item.subtitle}</Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copy(item)} aria-label="Copiar">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}