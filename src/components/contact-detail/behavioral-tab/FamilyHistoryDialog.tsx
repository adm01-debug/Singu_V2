import { useFamilyHistory } from '@/hooks/useFamilyHistory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History, RotateCcw, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  contactId: string;
}

export function FamilyHistoryDialog({ contactId }: Props) {
  const { history, isLoading, revert } = useFamilyHistory(contactId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Histórico" className="h-6 w-6 text-muted-foreground hover:text-primary">
          <History className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico Familiar
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 pt-4">
            {isLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Carregando histórico...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Nenhuma alteração registrada no histórico.</div>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="relative pl-6 pb-6 border-l border-border last:pb-0">
                  <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary/40 border border-primary/20" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true, locale: ptBR })}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-[10px] gap-1 hover:text-primary hover:bg-primary/5"
                        onClick={() => revert(entry)}
                      >
                        <RotateCcw className="h-3 w-3" /> Reverter
                      </Button>
                    </div>
                    <div className="p-2.5 rounded bg-muted/30 text-xs border border-border/50 italic leading-relaxed">
                      {entry.family_info}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
