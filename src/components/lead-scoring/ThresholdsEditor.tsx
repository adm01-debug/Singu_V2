import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import type { LeadScoreThreshold } from '@/hooks/useLeadScoring';
import { useUpdateThreshold } from '@/hooks/useLeadScoring';

interface Props {
  thresholds: LeadScoreThreshold[];
}

function ThresholdsEditorInner({ thresholds }: Props) {
  const update = useUpdateThreshold();
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Thresholds de Grade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {thresholds.map(t => {
          const v = drafts[t.id] ?? Number(t.min_score);
          const dirty = drafts[t.id] !== undefined && drafts[t.id] !== Number(t.min_score);
          return (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              <span className="font-semibold w-16">Grade {t.grade}</span>
              <span className="text-xs text-muted-foreground">≥</span>
              <Input type="number" min={0} max={100} value={v}
                onChange={e => setDrafts(prev => ({ ...prev, [t.id]: Number(e.target.value) }))}
                className="h-8 w-24" />
              <Button size="icon" variant="ghost" disabled={!dirty || update.isPending}
                onClick={() => { update.mutate({ id: t.id, min_score: v }); setDrafts(prev => { const n = { ...prev }; delete n[t.id]; return n; }); }}
                aria-label="Salvar">
                <Save className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export const ThresholdsEditor = memo(ThresholdsEditorInner);
