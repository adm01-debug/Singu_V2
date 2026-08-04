import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Share2, Copy, RotateCw } from "lucide-react";
import { useShareRoom, type DealRoom } from "@/hooks/useDealRooms";
import { toast } from "sonner";

export function ShareDialog({ room }: { room: DealRoom }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(room.share_enabled);
  const [token, setToken] = useState(room.share_token);
  const share = useShareRoom();

  const url = `${window.location.origin}/dr/${token}`;

  const toggle = async (v: boolean) => {
    const prev = enabled;
    setEnabled(v);
    try {
      const r = await share.mutateAsync({ room_id: room.id, enabled: v });
      setToken(r.token);
    } catch {
      setEnabled(prev);
    }
  };

  const rotate = async () => {
    const r = await share.mutateAsync({ room_id: room.id, rotate: true });
    setToken(r.token);
    toast.success("Token rotacionado");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Share2 className="h-4 w-4" />Compartilhar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Compartilhar Deal Room</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Link público ativo</Label>
            <Switch checked={enabled} onCheckedChange={toggle} />
          </div>
          {enabled && (
            <>
              <div className="flex gap-2">
                <Input value={url} readOnly />
                <Button variant="outline" size="icon" aria-label="Copiar" onClick={copy}><Copy className="h-4 w-4" /></Button>
              </div>
              <Button variant="ghost" size="sm" onClick={rotate} disabled={share.isPending}>
                <RotateCw className="h-4 w-4" />Rotacionar token
              </Button>
              <p className="text-xs text-muted-foreground">Qualquer pessoa com este link poderá ver o plano, marcar milestones de comprador e comentar.</p>
            </>
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
