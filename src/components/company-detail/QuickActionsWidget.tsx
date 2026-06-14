import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateQuickInteraction } from '@/hooks/useInteractionsRpc';
import { Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const QuickActionsWidget = React.memo(function QuickActionsWidget({ companyId }: { companyId: string }) {
  const [resumo, setResumo] = useState('');
  const [tipo, setTipo] = useState('call');
  const createInteraction = useCreateQuickInteraction();

  const handleCreate = async () => {
    if (!resumo.trim()) { toast.warning('Informe um resumo'); return; }
    try {
      await createInteraction.mutateAsync({
        p_company_id: companyId,
        p_tipo: tipo,
        p_resumo: resumo.trim(),
      });
      toast.success('Interação registrada!');
      setResumo('');
    } catch {
      toast.error('Erro ao registrar interação');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />Ação Rápida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Ligação</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="meeting">Reunião</SelectItem>
              <SelectItem value="note">Nota</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            placeholder="Resumo da interação..."
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={createInteraction.isPending}
            className="h-8 text-xs"
          >
            {createInteraction.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default QuickActionsWidget;
