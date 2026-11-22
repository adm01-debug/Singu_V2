import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpsertQBR } from "@/hooks/useCustomerSuccess";
import { Plus } from "lucide-react";

export function ScheduleQBRDialog({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const upsert = useUpsertQBR();

  const submit = async () => {
    if (!title.trim() || !scheduledAt) return;
    await upsert.mutateAsync({
      account_id: accountId,
      title: title.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
    });
    setTitle("");
    setScheduledAt("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Agendar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Agendar QBR</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: QBR Q1 2026" />
          </div>
          <div>
            <Label>Data e hora</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={upsert.isPending || !title.trim() || !scheduledAt}>Agendar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}