import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLeadScoreConfig, type LeadScoreConfig } from '@/hooks/useLeadScore';
import { parseApiError } from '@/lib/errorMessages';

const DEFAULTS: Omit<LeadScoreConfig, 'id'> = {
  weight_engagement: 0.3,
  weight_fit: 0.2,
  weight_intent: 0.25,
  weight_relationship: 0.25,
  grade_thresholds: { cold: 0, warm: 30, hot: 60, on_fire: 85 },
  auto_recalculate: true,
  recalculate_interval_hours: 6,
};

type Draft = Pick<LeadScoreConfig, 'weight_engagement' | 'weight_fit' | 'weight_intent' | 'weight_relationship'>;

const WEIGHT_FIELDS: Array<{ key: keyof Draft; label: string }> = [
  { key: 'weight_engagement', label: 'Engajamento' },
  { key: 'weight_fit', label: 'Fit' },
  { key: 'weight_intent', label: 'Intenção' },
  { key: 'weight_relationship', label: 'Relacionamento' },
];

export function LeadScoreWeightsEditor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: config, isLoading } = useLeadScoreConfig();
  const [draft, setDraft] = useState<Draft>({
    weight_engagement: DEFAULTS.weight_engagement,
    weight_fit: DEFAULTS.weight_fit,
    weight_intent: DEFAULTS.weight_intent,
    weight_relationship: DEFAULTS.weight_relationship,
  });

  useEffect(() => {
    if (!config) return;
    setDraft({
      weight_engagement: config.weight_engagement,
      weight_fit: config.weight_fit,
      weight_intent: config.weight_intent,
      weight_relationship: config.weight_relationship,
    });
  }, [config]);

  const save = useMutation({
    mutationFn: async (payload: Draft) => {
      if (!user?.id) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('lead_score_config')
        .upsert(
          { ...payload, user_id: user.id, grade_thresholds: config?.grade_thresholds ?? DEFAULTS.grade_thresholds },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-score-config'] });
      toast.success('Pesos salvos — aplicam-se no próximo cálculo');
    },
    onError: (e: Error) => toast.error(`Falha ao salvar: ${parseApiError(e)}`),
  });

  const sum = WEIGHT_FIELDS.reduce((acc, f) => acc + Number(draft[f.key]), 0);
  const valid = Math.abs(sum - 1) < 0.005;

  if (isLoading) {
    return <Card><CardContent className="py-6 text-sm text-muted-foreground">Carregando configuração…</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Pesos das dimensões</CardTitle>
        <CardDescription className="text-xs">
          A soma dos quatro pesos precisa ser exatamente 1,00. Total atual: <strong className={valid ? 'text-emerald-600' : 'text-destructive'}>{sum.toFixed(2)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {WEIGHT_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key} className="text-xs">{label}</Label>
              <Input
                id={key}
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={draft[key]}
                onChange={(e) => setDraft(d => ({ ...d, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={!valid || save.isPending} onClick={() => save.mutate(draft)}>
            <Save className="h-4 w-4 mr-2" />Salvar pesos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
