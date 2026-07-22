import { useState } from 'react';
import { useWinLossReasons, useUpsertReason, useDeleteReason, useSeedReasons } from '@/hooks/useWinLoss';
import type { ReasonCategory, ReasonOutcomeType } from '@/hooks/useWinLoss';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES: ReasonCategory[] = ['price', 'product', 'timing', 'relationship', 'competition', 'budget', 'authority', 'need', 'other'];

export function ReasonsEditor() {
  const { data: reasons } = useWinLossReasons();
  const upsert = useUpsertReason();
  const del = useDeleteReason();
  const seed = useSeedReasons();

  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<ReasonCategory>('product');
  const [newOutcome, setNewOutcome] = useState<ReasonOutcomeType>('lost');

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    try {
      await upsert.mutateAsync({ category: newCategory, label: newLabel.trim(), outcome_type: newOutcome });
      setNewLabel('');
      toast.success('Motivo adicionado');
    } catch {
      toast.error('Erro ao adicionar');
    }
  };

  const handleSeed = async () => {
    try {
      await seed.mutateAsync();
      toast.success('Motivos padrão carregados');
    } catch {
      toast.error('Erro ao popular padrões');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Motivos de Win/Loss</CardTitle>
        <Button size="sm" variant="outline" onClick={handleSeed} disabled={seed.isPending}>
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Popular padrões
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <div className="md:col-span-2">
            <Label>Label</Label>
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Ex: Preço acima do orçamento" />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v as ReasonCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select value={newOutcome} onValueChange={(v) => setNewOutcome(v as ReasonOutcomeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" aria-label="Adicionar" onClick={handleAdd}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {(reasons ?? []).map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 rounded-md border bg-card">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                <Badge variant="secondary" className="text-[10px]">{r.outcome_type}</Badge>
                <span className="text-sm truncate">{r.label}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => del.mutate(r.id)}
                aria-label="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {(!reasons || reasons.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum motivo cadastrado. Clique em "Popular padrões" para começar.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
