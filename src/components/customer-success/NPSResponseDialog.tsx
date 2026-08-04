import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSubmitNPS } from "@/hooks/useCustomerSuccess";
import { cn } from "@/lib/utils";

export function NPSResponseDialog({ accountId, open, onOpenChange }: { accountId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const submit = useSubmitNPS();

  const handleSubmit = async () => {
    if (score === null) return;
    await submit.mutateAsync({ account_id: accountId, score, comment: comment.trim() || undefined });
    setScore(null); setComment(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar resposta NPS</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Quanto você recomendaria nossa solução? (0-10)</Label>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className={cn(
                    "h-10 rounded-md border text-sm font-semibold tabular-nums transition-all",
                    score === i ? "ring-2 ring-primary scale-110" : "hover:border-primary/50",
                    i <= 6 ? "bg-destructive/5 border-destructive/30 text-destructive" :
                    i <= 8 ? "bg-warning/5 border-warning/30 text-warning" :
                    "bg-success/5 border-success/30 text-success"
                  )}
                >{i}</button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Detrator</span><span>Neutro</span><span>Promotor</span>
            </div>
          </div>
          <div>
            <Label className="text-sm">Comentário (opcional)</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="O que motivou essa nota?" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={score === null || submit.isPending}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
