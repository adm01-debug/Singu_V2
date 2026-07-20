import { memo } from 'react';
import { Play, Pause, Trash2, Mail, MessageSquare, Phone, Linkedin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Sequence } from '@/hooks/useSequences';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  active: { label: 'Ativa', variant: 'default' },
  paused: { label: 'Pausada', variant: 'secondary' },
  archived: { label: 'Arquivada', variant: 'destructive' },
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageSquare,
  call: Phone,
  linkedin: Linkedin,
};

interface Props {
  sequence: Sequence;
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}

export const SequenceCard = memo(({ sequence, onToggle, onDelete, onClick }: Props) => {
  const statusInfo = STATUS_MAP[sequence.status] || STATUS_MAP.draft;
  const replyRate = sequence.total_enrolled > 0
    ? Math.round((sequence.total_replied / sequence.total_enrolled) * 100)
    : 0;

  return (
    <Card
      className="cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => onClick(sequence.id)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{sequence.name}</h3>
            {sequence.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{sequence.description}</p>
            )}
          </div>
          <Badge variant={statusInfo.variant} className="shrink-0 text-[10px]">
            {statusInfo.label}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold">{sequence.total_enrolled}</p>
            <p className="text-[10px] text-muted-foreground">Inscritos</p>
          </div>
          <div>
            <p className="text-lg font-bold">{sequence.total_completed}</p>
            <p className="text-[10px] text-muted-foreground">Completos</p>
          </div>
          <div>
            <p className="text-lg font-bold">{replyRate}%</p>
            <p className="text-[10px] text-muted-foreground">Respostas</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <div className="flex items-center gap-1">
            {sequence.pause_on_reply && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">⏸ reply</span>
            )}
            {sequence.pause_on_meeting && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">⏸ reunião</span>
            )}
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost" size="icon" aria-label="Pausar" className="h-7 w-7"
              onClick={() => onToggle(sequence.id, sequence.status)}
              disabled={sequence.status === 'archived'}
            >
              {sequence.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </<Button
              variant="ghost" size="icon" aria-label="Remover" className="h-7 w-7 text-destructive"
              onClick={() => onDelete(sequence.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>           </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
SequenceCard.displayName = 'SequenceCard';
