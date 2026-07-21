import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

interface Props {
  contactId: string;
  currentScore: number;
  currentSentiment: string;
}

type MetricType = 'score' | 'sentiment' | 'last_contact' | 'stage';

export function MetricOverrideFlow({ contactId, currentScore, currentSentiment }: Props) {
  const { user } = useAuth();
  const [metricType, setMetricType] = useState<MetricType>('score');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const overrideMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, string | number> = {};
      let valToStore = newValue;

      if (metricType === 'score') {
        updates.relationship_score = parseInt(newValue);
      } else if (metricType === 'sentiment') {
        updates.sentiment = newValue;
      } else if (metricType === 'last_contact') {
        updates.last_interaction_at = new Date(newValue).toISOString();
        valToStore = updates.last_interaction_at;
      } else if (metricType === 'stage') {
        updates.relationship_stage = newValue;
      }

      if (!user) throw new Error('Usuário não autenticado');

      const [{ error: logError }, { error: updateError }] = await Promise.all([
        supabase.from('crm_metric_overrides').insert({
          user_id: user.id,
          contact_id: contactId,
          metric_type: metricType,
          old_value: metricType === 'score' ? currentScore.toString() : currentSentiment,
          new_value: valToStore,
          reason: reason,
        }),
        supabase.from('contacts').update(updates).eq('user_id', user.id).eq('id', contactId),
      ]);

      if (logError) throw logError;
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-intelligence', contactId] });
      toast.success('Métrica corrigida e sincronizada com cadências');
      setNewValue('');
      setReason('');
    },
    onError: (err: Error) => toast.error(`Erro ao corrigir: ${parseApiError(err)}`)
  });

  return (
    <Card className="border-amber-200 bg-amber-50/5">
      <CardHeader className="pb-3 border-b border-amber-100">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700">
          <Settings2 className="h-4 w-4" />
          Ajuste Manual e Sincronização
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <p className="text-[10px] text-amber-700/70 leading-relaxed italic">
          Use este painel para corrigir discrepâncias detectadas pela IA. As alterações impactam imediatamente as cadências de acompanhamento.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Métrica</Label>
            <Select value={metricType} onValueChange={(val) => { setMetricType(val as MetricType); setNewValue(''); }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Relationship Score</SelectItem>
                <SelectItem value="sentiment">Sentimento</SelectItem>
                <SelectItem value="last_contact">Data Último Contato</SelectItem>
                <SelectItem value="stage">Estágio do Relacionamento</SelectItem>
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
            ) : metricType === 'sentiment' ? (
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
            ) : metricType === 'stage' ? (
              <Select value={newValue} onValueChange={setNewValue}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione o estágio..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Desconhecido</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="qualified_lead">Lead Qualificado</SelectItem>
                  <SelectItem value="opportunity">Oportunidade</SelectItem>
                  <SelectItem value="negotiation">Negociação</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="loyal_customer">Cliente Fiel</SelectItem>
                  <SelectItem value="advocate">Promotor/Advogado</SelectItem>
                  <SelectItem value="at_risk">Em Risco</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input 
                type="date" 
                value={newValue} 
                onChange={(e) => setNewValue(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Justificativa da Alteração</Label>
          <Textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            className="text-xs min-h-[50px] resize-none"
            placeholder="Ex: Interação manual não registrada pelo sistema..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs font-bold text-amber-700 border-amber-200 hover:bg-amber-100"
            disabled={overrideMutation.isPending || !newValue || !reason}
            onClick={() => overrideMutation.mutate()}
          >
            <UserCheck className="h-3 w-3 mr-1.5" />
            Salvar e Sincronizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}