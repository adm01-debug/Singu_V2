/**
 * Conteúdo da aba "Bloqueios" (substitui a antiga aba "Handoff").
 *
 * Mantém o nome de arquivo `HandoffQueueTab.tsx` (só o default export
 * importado por `LeadRoutingModule.tsx` muda) para minimizar o diff. O
 * conceito de handoff SDR → Closer não existe mais no motor novo; o que
 * existe é bloqueio de cliente contra rotação, com aprovação quando o
 * vendedor excede a cota mensal de bloqueios.
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRodizioBloqueios, useBloquearCliente, useAprovarBloqueio } from '@/hooks/useRodizioBloqueios';
import { BLOQUEIO_STATUS_LABELS } from '@/types/rodizio';
import type { RodizioBloqueio, BloqueioStatus } from '@/types/rodizio';
import { Lock, Check, Plus, ShieldAlert, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function statusColor(status: BloqueioStatus): string {
  const map: Record<BloqueioStatus, string> = {
    ATIVO: 'bg-success/10 text-success border-success/30',
    PENDENTE_APROVACAO: 'bg-warning/10 text-warning border-warning/30',
    EXPIRADO: 'bg-muted text-muted-foreground',
    NENHUM: 'bg-muted text-muted-foreground',
  };
  return map[status] ?? '';
}

function BloquearClienteForm({ onDone }: { onDone: () => void }) {
  const bloquear = useBloquearCliente();
  const [customerId, setCustomerId] = useState('');
  const [dias, setDias] = useState(30);
  const [motivo, setMotivo] = useState('');

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>ID do Cliente (UUID) *</Label>
        <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
      </div>
      <div className="space-y-1.5">
        <Label>Dias de Bloqueio</Label>
        <Input type="number" min={1} max={365} value={dias} onChange={(e) => setDias(Number(e.target.value))} />
      </div>
      <div className="space-y-1.5">
        <Label>Motivo *</Label>
        <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Descreva a evidência/justificativa do bloqueio..." rows={3} />
      </div>
      <Button
        onClick={() => bloquear.mutate({ customerId, dias, motivo }, { onSuccess: onDone })}
        disabled={!customerId.trim() || !motivo.trim() || bloquear.isPending}
        className="w-full"
      >
        <Lock className="h-4 w-4 mr-2" />
        Bloquear Cliente
      </Button>
    </div>
  );
}

function BloqueioCard({ b }: { b: RodizioBloqueio }) {
  const aprovar = useAprovarBloqueio();
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="font-medium">{b.company_nome ?? 'Empresa desconhecida'}</span>
              <Badge className={statusColor(b.status)}>{BLOQUEIO_STATUS_LABELS[b.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vendedor: {b.vendedor_nome ?? '—'}
              {b.bloqueado_ate && <> · até {format(new Date(b.bloqueado_ate), 'dd/MM/yyyy', { locale: ptBR })}</>}
            </p>
            {b.bloqueio_motivo && <p className="text-xs mt-1 italic text-muted-foreground">"{b.bloqueio_motivo}"</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Solicitado por {b.bloqueado_por_nome ?? '—'}
              {b.aprovado_por_nome && <> · aprovado por {b.aprovado_por_nome}</>}
            </p>
          </div>
          {b.status === 'PENDENTE_APROVACAO' && (
            <Button
              size="sm"
              disabled={aprovar.isPending}
              onClick={() => aprovar.mutate(b.customer_id)}
            >
              <Check className="h-4 w-4 mr-1" /> Aprovar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HandoffQueueTab() {
  const { data: bloqueios = [], isLoading } = useRodizioBloqueios();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  const pendentes = bloqueios.filter((b) => b.status === 'PENDENTE_APROVACAO');
  const ativos = bloqueios.filter((b) => b.status === 'ATIVO');
  const expirados = bloqueios.filter((b) => b.status === 'EXPIRADO');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-warning" />
          Pendentes de Aprovação ({pendentes.length})
        </h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Bloquear Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Bloquear Cliente contra Rotação</DialogTitle></DialogHeader>
            <BloquearClienteForm onDone={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {pendentes.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum bloqueio pendente de aprovação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pendentes.map((b) => <BloqueioCard key={b.customer_id} b={b} />)}
        </div>
      )}

      {ativos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Ativos ({ativos.length})</h3>
          <div className="space-y-2">
            {ativos.map((b) => <BloqueioCard key={b.customer_id} b={b} />)}
          </div>
        </div>
      )}

      {expirados.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Expirados recentemente ({expirados.length})</h3>
          <div className="space-y-2">
            {expirados.slice(0, 20).map((b) => <BloqueioCard key={b.customer_id} b={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}
