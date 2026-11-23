import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecordSignal, type SignalType } from "@/hooks/useCustomerSuccess";
import { Plus } from "lucide-react";

const SIGNAL_LABEL: Record<SignalType, string> = {
  usage: "Uso do produto",
  support: "Suporte",
  engagement: "Engajamento",
  sentiment: "Sentimento",
  payment: "Pagamento",
  nps: "NPS",
};

export function RecordSignalDialog({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const [signalType, setSignalType] = useState<SignalType>("usage");
  const [score, setScore] = useState("70");
  const [weight, setWeight] = useState("1");
  const [source, setSource] = useState("");
  const record = useRecordSignal();

  const submit = async () => {
    await record.mutateAsync({
      account_id: accountId,
      signal_type: signalType,
      score: Number(score) || 0,
      weight: Number(weight) || 1,
      source: source.trim() || undefined,
    });
    setSource("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Plus className="h-4 w-4" />Registrar sinal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar sinal de saúde</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tipo de sinal</Label>
            <Select value={signalType} onValueChange={(v) => setSignalType(v as SignalType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SIGNAL_LABEL) as SignalType[]).map(t => (
                  <SelectItem key={t} value={t}>{SIGNAL_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Score (0–100)</Label>
              <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div>
              <Label>Peso</Label>
              <Input type="number" min={0} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Origem (opcional)</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ex: chamado #1234" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={record.isPending || !score}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}