import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2 } from 'lucide-react';
import { callRodizioRpc } from '@/lib/rodizioRpc';
import { useAppUserId } from '@/hooks/useAppUserId';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/errorMessages';
import type { RodizioCloserExecutarResult } from '@/types/rodizio';

/**
 * Decisão: o widget antigo chamava a Edge Function `lead-routing` (ação
 * `distribute`), que não existe mais. Não há um RPC equivalente de
 * "distribuir 1 lead avulso para o próximo da fila" no motor novo — a
 * distribuição agora é sempre por onda (staging → aprovação → aplicar).
 * O equivalente administrativo mais próximo é rodar uma execução de rodízio
 * de closers diretamente (`rodizio_closer_executar`), então foi isso que
 * este widget passou a fazer, sempre em DRY_RUN por padrão (o modo REAL fica
 * na aba Ondas, com fluxo de aprovação). Único uso deste componente é dentro
 * de `SalesTeamTab.tsx`.
 */
export default function QuickDistributeWidget() {
  const [limit, setLimit] = useState(10);
  const { data: appUserId } = useAppUserId();
  const qc = useQueryClient();

  const executar = useMutation({
    mutationFn: async () =>
      callRodizioRpc<RodizioCloserExecutarResult>('rodizio_closer_executar', {
        p_modo: 'DRY_RUN',
        p_limit: limit,
        p_executado_por_id: appUserId ?? null,
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['rodizio-execucoes'] });
      if (result.status !== 'success') {
        toast.error(result.message ?? 'Erro ao simular rodízio');
        return;
      }
      toast.success(`Simulação executada: ${result.total_elegiveis} cliente(s) elegível(is)`);
      if (Array.isArray(result.erros) && result.erros.length > 0) {
        toast.error(`${result.erros.length} cliente(s) com erro na simulação`);
      }
    },
    onError: (err) => {
      logger.error('[QuickDistribute]', err);
      toast.error(parseApiError(err, 'Erro ao simular rodízio'));
    },
  });

  return (
    <Card className="border border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Simular Rodízio de Closers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Limite de clientes</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              className="h-9"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
          <Button size="sm" onClick={() => executar.mutate()} disabled={executar.isPending} className="h-9">
            {executar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            Simular (DRY_RUN)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Roda uma simulação do rodízio de closers para os próximos {limit} clientes elegíveis, sem aplicar mudanças.
          O resultado aparece no histórico de execuções, na aba Ondas.
        </p>
      </CardContent>
    </Card>
  );
}
