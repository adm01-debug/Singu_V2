import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Settings2, Save, History, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  contactId: string;
  currentScore: number;
  currentSentiment: string;
}

export function MetricOverrideFlow({ contactId, currentScore, currentSentiment }: Props) {
  const [metricType, setMetricType] = useState<'score' | 'sentiment'>('score');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const overrideMutation = useMutation({
    mutationFn: async () => {
      const updates: any = {};
      if (metricType === 'score') updates.relationship_score = parseInt(newValue);
      else updates.sentiment = newValue;

      // 1. Log the override
      const { error: logError } = await supabase.from('crm_metric_overrides').insert({
        contact_id: contactId,
        metric_type: metricType,
        old_value: metricType === 'score' ? currentScore.toString() : currentSentiment,
        new_value: newValue,
        reason: reason
      });
      if (logError) throw logError;

      // 2. Update the contact
      const { error: updateError } = await supabase.from('contacts').update(updates).eq('id', contactId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      toast.success('Métrica corrigida manualmente');
      setNewValue('');
      setReason('');
    },
    onError: (err: any) => toast.error(`Erro ao corrigir: ${err.message}`)
  });

  return (
    <Card className="border-amber-200 bg-amber-50/5">
      <CardHeader className="pb-3 border-b border-amber-100">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700">
          <Settings2 className="h-4 w-4" />
          Ajuste Manual de Inteligência
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Métrica</Label>
            <Select value={metricType} onValueChange={(val: any) => setMetricType(val)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Relationship Score</SelectItem>
                <SelectItem value="sentiment">Sentimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Novo Valor</Label>
            {metricType === 'score' ? (
              <Input 
                type="number" 
                min="0" 
                max="100" 
                value={newValue} 
                onChange={(e) => setNewValue(e.target.value)}
                className="h-8 text-xs"
                placeholder="0-100"
              />
            ) : (
              <Select value={newValue} onValueChange={setNewValue}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positivo</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="negative">Negativo</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Justificativa da Alteração</Label>
          <Textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            className="text-xs min-h-[60px] resize-none"
            placeholder="Por que você está corrigindo este valor?"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs font-bold text-amber-700 border-amber-200 hover:bg-amber-100"
            disabled={overrideMutation.isPending}
            onClick={() => overrideMutation.mutate()}
          >
            <Save className="h-3 w-3 mr-1.5" />
            Salvar Correção
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
