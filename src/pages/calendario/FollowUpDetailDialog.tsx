import { User, Building2, CheckCircle2 } from 'lucide-react';
import { isToday, isPast, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { FollowUp } from './CalendarioContent';
import { interactionTypeLabels } from './CalendarioContent';

const interactionTypeIconsMap: Record<string, string> = {
  call: '📞', email: '📧', meeting: '👥', video_call: '📹', whatsapp: '💬', other: '💬',
};

interface FollowUpDetailDialogProps {
  followUp: FollowUp | null;
  onClose: () => void;
  onMarkCompleted: (id: string) => void;
}

export function FollowUpDetailDialog({ followUp, onClose, onMarkCompleted }: FollowUpDetailDialogProps) {
  if (!followUp) return null;

  const isOverdue = followUp.follow_up_date && isPast(parseISO(followUp.follow_up_date)) && !isToday(parseISO(followUp.follow_up_date));

  return (
    <Dialog open={!!followUp} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{interactionTypeIconsMap[followUp.type] || '💬'}</span>
            {followUp.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{interactionTypeLabels[followUp.type] || followUp.type}</Badge>
            {isOverdue && <Badge variant="destructive">Atrasado</Badge>}
          </div>

          <Separator />

          {followUp.contact && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><User className="w-4 h-4" /></div>
              <div>
                <p className="font-medium">{followUp.contact.first_name} {followUp.contact.last_name}</p>
                <p className="text-sm text-muted-foreground">Contato</p>
              </div>
            </div>
          )}

          {followUp.company && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><Building2 className="w-4 h-4" /></div>
              <div>
                <p className="font-medium">{followUp.company.name}</p>
                <p className="text-sm text-muted-foreground">Empresa</p>
              </div>
            </div>
          )}

          {followUp.content && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{followUp.content}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button className="flex-1 gap-2" onClick={() => onMarkCompleted(followUp.id)}>
              <CheckCircle2 className="w-4 h-4" />Marcar como Concluído
            </Button>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
