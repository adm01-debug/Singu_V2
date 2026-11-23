import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDealRoom, type DealRoom, type DealRoomStatus } from "@/hooks/useDealRooms";

const STATUS_LABEL: Record<DealRoomStatus, string> = {
  active: "Ativo",
  won: "Ganha",
  lost: "Perdida",
  paused: "Pausado",
};

interface Props {
  room: DealRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealRoomEditDialog({ room, open, onOpenChange }: Props) {
  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description ?? "");
  const [status, setStatus] = useState<DealRoomStatus>(room.status);
  const [dealValue, setDealValue] = useState(room.deal_value === null ? "" : String(room.deal_value));
  const [targetClose, setTargetClose] = useState(room.target_close_date ?? "");
  const update = useUpdateDealRoom();

  const submit = async () => {
    if (!title.trim()) return;
    await update.mutateAsync({
      id: room.id,
      title: title.trim(),
      description: description.trim() || null,
      status,
      deal_value: dealValue.trim() ? Number(dealValue) : null,
      target_close_date: targetClose || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Deal Room</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DealRoomStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as DealRoomStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor do deal (R$)</Label>
              <Input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <div>
            <Label>Data alvo de fechamento</Label>
            <Input type="date" value={targetClose} onChange={(e) => setTargetClose(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={update.isPending || !title.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}