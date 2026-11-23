import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateABMAccount, type ABMAccount, type AccountStatus, type AccountTier } from "@/hooks/useABM";

const STATUS_LABEL: Record<AccountStatus, string> = {
  active: "Ativa",
  nurture: "Nurturing",
  closed_won: "Ganha",
  closed_lost: "Perdida",
  paused: "Pausada",
};

const TIER_LABEL: Record<AccountTier, string> = {
  strategic: "Strategic",
  enterprise: "Enterprise",
  mid: "Mid-market",
  smb: "SMB",
};

interface Props {
  account: ABMAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ABMAccountEditDialog({ account, open, onOpenChange }: Props) {
  const [companyName, setCompanyName] = useState(account.company_name);
  const [tier, setTier] = useState<AccountTier>(account.tier);
  const [status, setStatus] = useState<AccountStatus>(account.status);
  const [targetRevenue, setTargetRevenue] = useState(
    account.target_revenue === null ? "" : String(account.target_revenue)
  );
  const [notes, setNotes] = useState(account.notes ?? "");
  const update = useUpdateABMAccount();

  const submit = async () => {
    if (!companyName.trim()) return;
    await update.mutateAsync({
      id: account.id,
      company_name: companyName.trim(),
      tier,
      status,
      target_revenue: targetRevenue.trim() ? Number(targetRevenue) : null,
      notes: notes.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar conta ABM</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome da empresa</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as AccountTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIER_LABEL) as AccountTier[]).map(t => (
                    <SelectItem key={t} value={t}>{TIER_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AccountStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as AccountStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Receita alvo (R$)</Label>
            <Input type="number" value={targetRevenue} onChange={(e) => setTargetRevenue(e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={update.isPending || !companyName.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}