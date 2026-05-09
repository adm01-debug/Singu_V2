import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarClock, Plus, ShieldCheck, History, Trash2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { RELATIONSHIP_STAGE_LABELS } from '@/types';
import { toast } from 'sonner';

export function CadenceRulesConfig() {
  const queryClient = useQueryClient();
  const { data: rules, isLoading } = useQuery({
    queryKey: ['crm-cadence-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_cadence_rules')
        .select('*')
        .eq('is_active', true)
        .order('relationship_stage');
      if (error) throw error;
      return data;
    }
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_cadence_rules').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-cadence-rules'] });
      toast.success('Regra removida');
    }
  });

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-lg" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Regras de Cadência por Estágio
        </CardTitle>
        <Button size="sm" variant="outline" className="h-8 text-[10px] uppercase font-bold">
          <Plus className="h-3 w-3 mr-1" /> Nova Regra
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase">Estágio</TableHead>
              <TableHead className="text-[10px] uppercase text-center">Frequência</TableHead>
              <TableHead className="text-[10px] uppercase text-center">Prioridade</TableHead>
              <TableHead className="text-[10px] uppercase text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules?.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="text-xs font-semibold">
                  {RELATIONSHIP_STAGE_LABELS[rule.relationship_stage as any] || rule.relationship_stage}
                </TableCell>
                <TableCell className="text-xs text-center">
                  Cada {rule.frequency_days} dias
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-[9px] uppercase">
                    {rule.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteRule.mutate(rule.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rules?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground italic">
                  Nenhuma regra personalizada configurada. O sistema está usando os padrões globais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-primary/80">
            <strong>Configuração Global:</strong> As cadências garantem que nenhum contato seja esquecido. Quando um contato atinge o limite de dias sem interação definido para seu estágio, um alerta é gerado automaticamente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
