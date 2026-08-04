import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateABMAccount, useABMAccounts, type AccountTier } from "@/hooks/useABM";

export function CreateAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useCreateABMAccount();
  const { data: accounts = [] } = useABMAccounts();
  const [form, setForm] = useState({
    company_name: "",
    external_company_id: "",
    tier: "mid" as AccountTier,
    target_revenue: "",
    parent_account_id: "",
    notes: "",
  });

  const onSubmit = () => {
    if (!form.company_name) return;
    create.mutate(
      {
        company_name: form.company_name,
        external_company_id: form.external_company_id || `manual-${Date.now()}`,
        tier: form.tier,
        target_revenue: form.target_revenue ? Number(form.target_revenue) : undefined,
        parent_account_id: form.parent_account_id || null,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({ company_name: "", external_company_id: "", tier: "mid", target_revenue: "", parent_account_id: "", notes: "" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Conta ABM</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome da empresa *</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v as AccountTier })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategic">Estratégica</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="mid">Mid-Market</SelectItem>
                  <SelectItem value="smb">SMB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Receita-alvo (R$)</Label>
              <Input
                type="number"
                value={form.target_revenue}
                onChange={(e) => setForm({ ...form, target_revenue: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>ID externo (opcional)</Label>
            <Input
              value={form.external_company_id}
              onChange={(e) => setForm({ ...form, external_company_id: e.target.value })}
              placeholder="ID da empresa no sistema externo"
            />
          </div>
          <div>
            <Label>Conta-mãe (opcional)</Label>
            <Select
              value={form.parent_account_id || "__none__"}
              onValueChange={(v) => setForm({ ...form, parent_account_id: v === "__none__" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={create.isPending || !form.company_name}>
            {create.isPending ? "Criando..." : "Criar conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
