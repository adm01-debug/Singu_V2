import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Phone, Sparkles, Quote, Inbox } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvidenceForLabel, type EvidenceHit } from '@/hooks/useEvidenceForLabel';
import { InsightFeedbackControls } from './InsightFeedbackControls';

export type EvidenceKind = 'preference' | 'hobby' | 'tone';

export interface EvidenceContext {
  kind: EvidenceKind;
  label: string;
  /** Evidência textual retornada pela IA no momento da geração. */
  aiEvidence?: string | null;
}

interface Props {
  contactId: string;
  context: EvidenceContext | null;
  onOpenChange: (open: boolean) => void;
}

const KIND_LABEL: Record<EvidenceKind, string> = {
  preference: 'Preferência',
  hobby: 'Hobby / interesse',
  tone: 'Tom de comunicação',
};

function SourceIcon({ source }: { source: EvidenceHit['source'] }) {
  const cls = 'h-3.5 w-3.5';
  if (source === 'whatsapp') return <MessageCircle className={cls} />;
  if (source === 'call') return <Phone className={cls} />;
  return <Inbox className={cls} />;
}

const SOURCE_LABEL: Record<EvidenceHit['source'], string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  interaction: 'Interação',
};

function HitCard({ hit, term }: { hit: EvidenceHit; term: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3 text-sm">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <SourceIcon source={hit.source} />
          <span className="font-medium text-foreground">{SOURCE_LABEL[hit.source]}</span>
          {hit.title && <span>· {hit.title}</span>}
          {hit.direction && <Badge variant="outline" className="ml-1 text-[10px]">{hit.direction}</Badge>}
          {hit.from_me !== null && hit.from_me !== undefined && (
            <Badge variant="outline" className="ml-1 text-[10px]">{hit.from_me ? 'Nós' : 'Ele/ela'}</Badge>
          )}
        </div>
        <span>{format(new Date(hit.at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
      </div>
      <p className="mt-2 leading-relaxed text-foreground/90">
        {highlightTerm(hit.excerpt, term)}
      </p>
      {hit.sentiment && (
        <Badge variant="secondary" className="mt-2 text-[10px]">Sentimento: {hit.sentiment}</Badge>
      )}
    </div>
  );
}

function highlightTerm(text: string, term: string): React.ReactNode {
  if (!term.trim()) return text;
  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const t = term.toLowerCase();
  let i = 0;
  let idx = lower.indexOf(t, i);
  let key = 0;
  while (idx !== -1) {
    if (idx > i) parts.push(<span key={key++}>{text.slice(i, idx)}</span>);
    parts.push(<mark key={key++} className="rounded bg-primary/20 px-0.5 text-foreground">{text.slice(idx, idx + term.length)}</mark>);
    i = idx + term.length;
    idx = lower.indexOf(t, i);
  }
  if (i < text.length) parts.push(<span key={key++}>{text.slice(i)}</span>);
  return parts;
}

export function EvidenceDrillDownSheet({ contactId, context, onOpenChange }: Props) {
  const open = context !== null;
  const label = context?.label ?? '';
  const { data: hits = [], isLoading, error } = useEvidenceForLabel(open ? contactId : null, label);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden sm:max-w-lg">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {context ? KIND_LABEL[context.kind] : 'Evidências'}
          </SheetTitle>
          <SheetDescription>
            {context ? <>Evidências que embasaram <span className="font-medium text-foreground">"{context.label}"</span>.</> : null}
          </SheetDescription>
        </SheetHeader>

        {context?.aiEvidence && (
          <div className="mt-4 rounded-md border-l-2 border-primary bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Quote className="h-3 w-3" /> Justificativa da IA
            </div>
            <p className="mt-1 text-sm text-foreground/90">{context.aiEvidence}</p>
          </div>
        )}

        {context && (
          <div className="mt-3">
            <InsightFeedbackControls
              contactId={contactId}
              kind={context.kind}
              label={context.label}
            />
          </div>
        )}

        <div className="mt-4 mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium">Trechos encontrados no histórico</h4>
          <Badge variant="outline" className="text-[10px]">{hits.length}</Badge>
        </div>

        <ScrollArea className="h-[calc(100vh-260px)] pr-3">
          <div className="space-y-2">
            {isLoading && (
              <>
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
              </>
            )}

            {error && (
              <p className="text-sm text-destructive">Erro ao buscar evidências: {(error as Error).message}</p>
            )}

            {!isLoading && !error && hits.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum trecho contendo <span className="font-medium">"{label}"</span> foi encontrado no histórico.
                {context?.kind === 'tone' && (
                  <p className="mt-1 text-xs">Para tom, o insight é derivado do estilo geral das mensagens, sem citação literal.</p>
                )}
              </div>
            )}

            {hits.map((h) => <HitCard key={`${h.source}-${h.id}`} hit={h} term={label} />)}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}