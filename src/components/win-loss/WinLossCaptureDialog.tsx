import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWinLossReasons, useCompetitors, useUpsertWinLossRecord, useWinLossRecordByDeal } from '@/hooks/useWinLoss';
import type { WinLossOutcome } from '@/hooks/useWinLoss';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  initialOutcome?: WinLossOutcome;
  dealValue?: number;
}

export function WinLossCaptureDialog({ open, onOpenChange, dealId, initialOutcome = 'won', dealValue }: Props) {
  const [outcome, setOutcome] = useState<WinLossOutcome>(initialOutcome);
  const [reasonId, setReasonId] = useState<string>('');
  const [competitorId, setCompetitorId] = useState<string>('');
  const [value, setValue] = useState<string>(dealValue ? String(dealValue) : '');
  const [cycle, setCycle] = useState<string>('');
  const [lessons, setLessons] = useState<string>('');

  const { data: existing } = useWinLossRecordByDeal(open ? dealId : null);
  const { data: reasons } = useWinLossReasons(outcome === 'won' || outcome === 'lost' ? outcome : undefined);
  const { data: competitors } = useCompetitors();
  const upsert = useUpsertWinLossRecord();

  useEffect(() => {
    if (existing) {
      setOutcome(existing.outcome);
      setReasonId(existing.primary_reason_id ?? '');
      setCompetitorId(existing.competitor_id ?? '');
      setValue(existing.deal_value ? String(existing.deal_value) : '');
      setCycle(existing.sales_cycle_days ? String(existing.sales_cycle_days) : '');
      setLessons(existing.lessons_learned ?? '');
    }
  }, [existing]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        deal_id: dealId,
        outcome,
        primary_reason_id: reasonId || null,
        competitor_id: competitorId || null,
        deal_value: value ? Number(value) : null,
        sales_cycle_days: cycle ? Number(cycle) : null,
        lessons_learned: lessons || null,
      });
      toast.success('Win/Loss registrado');
      onOpenChange(false);
    } catch (e) {
      toast.error('Erro ao salvar', { description: parseApiError(e) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Win/Loss</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Resultado</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as WinLossOutcome)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
                <SelectItem value="no_decision">Sem decisão</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Motivo principal</Label>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger><SelectValue placeholder="Selecione um motivo" /></SelectTrigger>
              <SelectContent>
                {(reasons ?? []).map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Concorrente (opcional)</Label>
            <Select value={competitorId || 'none'} onValueChange={(v) => setCompetitorId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(competitors ?? []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div>
              <Label>Ciclo (dias)</Label>
              <Input type="number" value={cycle} onChange={(e) => setCycle(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Lições aprendidas</Label>
            <Textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              rows={3}
              placeholder="O que aprendemos com este deal?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
