import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpsertCampaign, useABMAccounts, type CampaignType, type ABMCampaign } from "@/hooks/useABM";

const channelOptions = ["email", "linkedin", "whatsapp", "phone", "ads", "events", "direct_mail"];

export function ABMCampaignDialog({
  open, onOpenChange, initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<ABMCampaign>;
}) {
  const upsert = useUpsertCampaign();
  const { data: accounts = [] } = useABMAccounts();
  const [form, setForm] = useState<Partial<ABMCampaign>>(
    initial ?? {
      name: "",
      campaign_type: "one_to_few",
      target_account_ids: [],
      channels: [],
      status: "draft",
    }
  );

  const toggleAccount = (id: string) => {
    const cur = form.target_account_ids ?? [];
    setForm({
      ...form,
      target_account_ids: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
  };
  const toggleChannel = (ch: string) => {
    const cur = form.channels ?? [];
    setForm({ ...form, channels: cur.includes(ch) ? cur.filter((x) => x !== ch) : [...cur, ch] });
  };

  const onSubmit = () => {
    if (!form.name || !form.campaign_type) return;
    upsert.mutate(
      {
        ...form,
        name: form.name,
        campaign_type: form.campaign_type as CampaignType,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial?.id ? "Editar" : "Nova"} campanha ABM</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.campaign_type ?? "one_to_few"}
                onValueChange={(v) => setForm({ ...form, campaign_type: v as CampaignType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_to_one">1:1 (Hyper-personalizada)</SelectItem>
                  <SelectItem value="one_to_few">1:Few (Cluster)</SelectItem>
                  <SelectItem value="one_to_many">1:Many (Programática)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status ?? "draft"}
                onValueChange={(v) => setForm({ ...form, status: v as ABMCampaign["status"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="archived">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Término</Label>
              <Input type="date" value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <Label>Budget (R$)</Label>
              <Input
                type="number"
                value={form.budget ?? ""}
                onChange={(e) => setForm({ ...form, budget: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>
          <div>
            <Label>Canais</Label>
            <div className="flex flex-wrap gap-3 mt-1">
              {channelOptions.map((ch) => (
                <label key={ch} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={(form.channels ?? []).includes(ch)} onCheckedChange={() => toggleChannel(ch)} />
                  <span className="capitalize">{ch.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Contas-alvo ({(form.target_account_ids ?? []).length} selecionada(s))</Label>
            <ScrollArea className="h-40 border rounded-md p-2 mt-1">
              {accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma conta cadastrada</p>
              ) : (
                accounts.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                    <Checkbox
                      checked={(form.target_account_ids ?? []).includes(a.id)}
                      onCheckedChange={() => toggleAccount(a.id)}
                    />
                    <span className="flex-1 truncate">{a.company_name}</span>
                    <span className="text-xs text-muted-foreground">{a.tier} · {a.account_score}</span>
                  </label>
                ))
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={upsert.isPending || !form.name}>
            {upsert.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
