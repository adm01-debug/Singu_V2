import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpsertCSAccount, type CSTier } from "@/hooks/useCustomerSuccess";
import { Plus } from "lucide-react";

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ account_name: "", tier: "mid" as CSTier, arr: "", contract_start: "", renewal_date: "", notes: "" });
  const upsert = useUpsertCSAccount();

  const submit = async () => {
    if (!form.account_name.trim()) return;
    await upsert.mutateAsync({
      account_name: form.account_name.trim(),
      tier: form.tier,
      arr: Number(form.arr) || 0,
      contract_start: form.contract_start || null,
      renewal_date: form.renewal_date || null,
      notes: form.notes.trim() || null,
    });
    setForm({ account_name: "", tier: "mid", arr: "", contract_start: "", renewal_date: "", notes: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Nova conta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar conta de Customer Success</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome da conta</Label><Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="Ex: Acme Corp" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v as CSTier })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategic">Strategic</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="mid">Mid-Market</SelectItem>
                  <SelectItem value="smb">SMB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>ARR (R$)</Label><Input type="number" value={form.arr} onChange={(e) => setForm({ ...form, arr: e.target.value })} placeholder="120000" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Início contrato</Label><Input type="date" value={form.contract_start} onChange={(e) => setForm({ ...form, contract_start: e.target.value })} /></div>
            <div><Label>Renovação</Label><Input type="date" value={form.renewal_date} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} /></div>
          </div>
          <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!form.account_name.trim() || upsert.isPending}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
