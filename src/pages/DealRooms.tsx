import { useState } from "react";
import { useDealRooms, useCreateDealRoom, type DealRoomStatus } from "@/hooks/useDealRooms";
import { DealRoomCard } from "@/components/deal-rooms/DealRoomCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

export default function DealRooms() {
  const [status, setStatus] = useState<DealRoomStatus | "all">("all");
  const { data = [], isLoading } = useDealRooms({ status });
  const create = useCreateDealRoom();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", deal_name: "", description: "", target_close_date: "", deal_value: "" });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6" />Deal Rooms</h1>
          <p className="text-sm text-muted-foreground">Workspaces colaborativos com plano de ação compartilhado.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Novo Deal Room</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Deal Room</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Nome do deal</Label><Input value={form.deal_name} onChange={(e) => setForm({ ...form, deal_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor (R$)</Label><Input type="number" value={form.deal_value} onChange={(e) => setForm({ ...form, deal_value: e.target.value })} /></div>
                <div><Label>Target close</Label><Input type="date" value={form.target_close_date} onChange={(e) => setForm({ ...form, target_close_date: e.target.value })} /></div>
              </div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button disabled={!form.title || create.isPending} onClick={async () => {
                const r = await create.mutateAsync({
                  title: form.title,
                  deal_name: form.deal_name || undefined,
                  description: form.description || undefined,
                  target_close_date: form.target_close_date || undefined,
                  deal_value: form.deal_value ? Number(form.deal_value) : undefined,
                });
                setOpen(false);
                navigate(`/deal-rooms/${r.id}`);
              }}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as DealRoomStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="won">Ganhos</TabsTrigger>
          <TabsTrigger value="lost">Perdidos</TabsTrigger>
          <TabsTrigger value="paused">Pausados</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum deal room ainda.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((r) => <DealRoomCard key={r.id} room={r} />)}
        </div>
      )}
    </div>
  );
}
