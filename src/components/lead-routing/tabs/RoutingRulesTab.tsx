/**
 * Conteúdo da aba "Ondas" (substitui a antiga aba "Regras").
 *
 * O arquivo mantém o nome `RoutingRulesTab.tsx` para minimizar o diff (só o
 * default export importado por `LeadRoutingModule.tsx` é trocado); o
 * conteúdo foi totalmente reescrito. O conceito de "regra de roteamento"
 * (round-robin/weighted/território) não existe mais — o motor novo trabalha
 * em ondas: sugestão automática → staging → aprovação → aplicação
 * (DRY_RUN/REAL) → histórico de execuções, com possibilidade de reverter.
 * O conteúdo que antes vivia nas abas "Histórico" e "Auditoria"
 * (execuções/redistribuições) passou a viver aqui, como histórico de
 * execuções de onda.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, Check, X, PlayCircle, History, RotateCcw, AlertTriangle, Layers, Loader2,
} from 'lucide-react';
import {
  useRodizioStaging, useDecidirStaging, useSugerirDistribuicao, useAplicarOnda,
  useRodizioExecucoes, useReverterExecucao,
} from '@/hooks/useRodizioOndas';
import {
  STAGING_STATUS_LABELS, EXECUCAO_TIPO_LABELS, EXECUCAO_MODO_LABELS,
} from '@/types/rodizio';
import type { RodizioFiltrosSugestao, RodizioStagingRow } from '@/types/rodizio';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function SugerirDistribuicaoForm({ onda, onDone }: { onda: number; onDone: () => void }) {
  const sugerir = useSugerirDistribuicao();
  const [uf, setUf] = useState('');
  const [ramo, setRamo] = useState('');
  const [segmento, setSegmento] = useState('');
  const [limit, setLimit] = useState(100);

  const handleSubmit = () => {
    const filtros: RodizioFiltrosSugestao = { limit };
    if (uf.trim()) filtros.uf = uf.trim().toUpperCase();
    if (ramo.trim()) filtros.ramo_atividade = ramo.trim();
    if (segmento.trim()) filtros.segmento = segmento.trim();
    sugerir.mutate({ onda, filtros }, { onSuccess: onDone });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>UF</Label>
          <Input value={uf} onChange={(e) => setUf(e.target.value)} placeholder="Ex: SP" maxLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Segmento</Label>
          <Input value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Ex: PME" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Ramo de Atividade</Label>
        <Input value={ramo} onChange={(e) => setRamo(e.target.value)} placeholder="Filtro livre" />
      </div>
      <div className="space-y-1.5">
        <Label>Limite de clientes</Label>
        <Input type="number" min={1} max={5000} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
      </div>
      <Button onClick={handleSubmit} disabled={sugerir.isPending} className="w-full">
        {sugerir.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Gerar Sugestão
      </Button>
    </div>
  );
}

function StagingRow({ row }: { row: RodizioStagingRow }) {
  const decidir = useDecidirStaging();
  return (
    <Card className="border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono text-muted-foreground truncate">Cliente: {row.customer_id}</p>
            <div className="flex items-center gap-2 flex-wrap mt-1 text-xs">
              <Badge variant="outline">{STAGING_STATUS_LABELS[row.status]}</Badge>
              <span className="text-muted-foreground">Origem: {row.origem}</span>
              {row.closer_destino_id && <span className="text-muted-foreground">Closer #{row.closer_destino_id}</span>}
              {row.sdr_destino_id && <span className="text-muted-foreground">SDR #{row.sdr_destino_id}</span>}
            </div>
          </div>
          {row.status === 'RASCUNHO' && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="default"
                disabled={decidir.isPending}
                onClick={() => decidir.mutate({ id: row.id, decisao: 'APROVADO' })}
              >
                <Check className="h-4 w-4 mr-1" /> Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={decidir.isPending}
                onClick={() => decidir.mutate({ id: row.id, decisao: 'REJEITADO' })}
              >
                <X className="h-4 w-4 mr-1" /> Rejeitar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AplicarOndaDialog({ onda }: { onda: number }) {
  const aplicar = useAplicarOnda();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlayCircle className="h-4 w-4 mr-1" /> Aplicar Onda
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Aplicar Onda {onda}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Rode primeiro em simulação (DRY_RUN) para conferir o impacto antes de aplicar de verdade (REAL).
          Somente linhas com status <strong>Aprovado</strong> são consideradas.
        </p>
        {aplicar.data && (
          <div className="rounded-lg border p-3 text-xs space-y-1 bg-muted/30">
            <p>Aprovados: {aplicar.data.total_aprovados}</p>
            <p>Aplicados: {aplicar.data.total_aplicados}</p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={aplicar.isPending}
            onClick={() => aplicar.mutate({ onda, modo: 'DRY_RUN' })}
          >
            Simular (DRY_RUN)
          </Button>
          <Button
            variant="destructive"
            disabled={aplicar.isPending}
            onClick={() => aplicar.mutate({ onda, modo: 'REAL' }, { onSuccess: () => setOpen(false) })}
          >
            Aplicar de Verdade (REAL)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExecucoesHistorico() {
  const { data: execucoes = [], isLoading } = useRodizioExecucoes();
  const reverter = useReverterExecucao();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {execucoes.length === 0 && (
        <Card className="border border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma execução registrada ainda.</p>
          </CardContent>
        </Card>
      )}
      {execucoes.slice(0, 30).map((e) => (
        <Card key={e.id} className="border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <Badge variant="outline">{EXECUCAO_TIPO_LABELS[e.tipo]}</Badge>
                  <Badge variant={e.modo === 'REAL' ? 'default' : 'secondary'}>{EXECUCAO_MODO_LABELS[e.modo]}</Badge>
                  {e.foi_revertida && <Badge variant="destructive">Revertida</Badge>}
                  <span className="text-muted-foreground text-xs">por {e.executado_por_nome ?? 'Sistema'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(e.iniciado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  {' · '}
                  {formatDistanceToNow(new Date(e.iniciado_em), { addSuffix: true, locale: ptBR })}
                  {' · '}
                  {e.total_rotacionados ?? 0}/{e.total_elegiveis ?? 0} rotacionados
                </p>
              </div>
              {e.modo === 'REAL' && !e.foi_revertida && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reverter.isPending}
                  onClick={() => reverter.mutate(e.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Reverter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RoutingRulesTab() {
  const [onda, setOnda] = useState(1);
  const { data: staging = [], isLoading } = useRodizioStaging(onda);
  const [showSugerir, setShowSugerir] = useState(false);

  const rascunhos = staging.filter((r) => r.status === 'RASCUNHO');
  const aprovados = staging.filter((r) => r.status === 'APROVADO');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm">Onda</Label>
          <Input
            type="number"
            min={1}
            value={onda}
            onChange={(e) => setOnda(Number(e.target.value) || 1)}
            className="w-20 h-8"
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={showSugerir} onOpenChange={setShowSugerir}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Sparkles className="h-4 w-4 mr-1" /> Sugerir Distribuição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Sugerir Distribuição — Onda {onda}</DialogTitle></DialogHeader>
              <SugerirDistribuicaoForm onda={onda} onDone={() => setShowSugerir(false)} />
            </DialogContent>
          </Dialog>
          <AplicarOndaDialog onda={onda} />
        </div>
      </div>

      <div className="flex gap-1.5">
        <Badge variant="outline" className="text-xs">{staging.length} na onda</Badge>
        <Badge variant="outline" className="text-xs text-warning">{rascunhos.length} rascunho</Badge>
        <Badge variant="outline" className="text-xs text-success">{aprovados.length} aprovado</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {staging.length === 0 && (
            <Card className="border border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhuma linha de staging nesta onda</p>
                <p className="text-xs mt-1">Use "Sugerir Distribuição" para gerar propostas automaticamente.</p>
              </CardContent>
            </Card>
          )}
          {staging.slice(0, 100).map((row) => <StagingRow key={row.id} row={row} />)}
          {staging.length > 100 && (
            <p className="text-xs text-center text-muted-foreground py-2">Mostrando 100 de {staging.length} registros</p>
          )}
        </div>
      )}

      <div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Execuções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExecucoesHistorico />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
