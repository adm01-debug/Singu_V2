import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import type { LeadScoreRule } from '@/hooks/useLeadScoring';
import { useUpdateRule } from '@/hooks/useLeadScoring';

interface Props {
  rules: LeadScoreRule[];
}

const DIMENSION_LABEL: Record<string, string> = {
  fit: 'Fit (Perfil)',
  engagement: 'Engajamento',
  intent: 'Intenção',
  relationship: 'Relação',
};

function ScoreRulesEditorInner({ rules }: Props) {
  const update = useUpdateRule();
  const [drafts, setDrafts] = useState<Record<string, Partial<LeadScoreRule>>>({});

  const grouped = rules.reduce<Record<string, LeadScoreRule[]>>((acc, r) => {
    if (!acc[r.dimension]) acc[r.dimension] = [];
    acc[r.dimension].push(r);
    return acc;
  }, {});

  const setDraft = (id: string, patch: Partial<LeadScoreRule>) =>
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const save = (rule: LeadScoreRule) => {
    const d = drafts[rule.id] ?? {};
    update.mutate({
      id: rule.id,
      weight: d.weight ?? rule.weight,
      decay_days: d.decay_days ?? rule.decay_days,
      active: d.active ?? rule.active,
    });
    setDrafts(prev => { const n = { ...prev }; delete n[rule.id]; return n; });
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([dim, list]) => (
        <Card key={dim}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{DIMENSION_LABEL[dim] ?? dim}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {list.map(r => {
              const d = drafts[r.id] ?? {};
              const dirty = Object.keys(d).length > 0;
              return (
                <div key={r.id} className="grid grid-cols-12 gap-2 items-center text-xs border-b pb-2 last:border-b-0">
                  <div className="col-span-4 font-mono text-muted-foreground">{r.signal_key}</div>
                  <div className="col-span-3">
                    <Label className="text-[10px]">Peso</Label>
                    <Input type="number" step="0.5" value={d.weight ?? r.weight}
                      onChange={e => setDraft(r.id, { weight: Number(e.target.value) })}
                      className="h-7 text-xs" />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-[10px]">Decay (dias)</Label>
                    <Input type="number" value={d.decay_days ?? r.decay_days}
                      onChange={e => setDraft(r.id, { decay_days: Number(e.target.value) })}
                      className="h-7 text-xs" />
                  </div>
                  <div className="col-span-1 flex flex-col items-center">
                    <Label className="text-[10px]">Ativa</Label>
                    <Switch checked={d.active ?? r.active}
                      onCheckedChange={v => setDraft(r.id, { active: v })} />
                  </div>
                  <div className="col-span-1">
                    <Button size="icon" variant="ghost" disabled={!dirty || update.isPending}
                      onClick={() => save(r)} aria-label="Salvar">
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const ScoreRulesEditor = memo(ScoreRulesEditorInner);
