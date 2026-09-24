import React, { useState, lazy, Suspense } from 'react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Edit, UserCircle, Palmtree, Users, Snowflake } from 'lucide-react';
import { useRodizioEquipe, useUpdateRodizioMembro, useRodizioConfigFlags } from '@/hooks/useRodizioEquipe';
import type { RodizioCloserCarga, RodizioSdrCarga } from '@/types/rodizio';
import { Skeleton } from '@/components/ui/skeleton';

const QuickDistributeWidget = lazy(() => import('../QuickDistributeWidget'));

function isAfastado(afastadoAte: string | null): boolean {
  if (!afastadoAte) return false;
  return new Date(afastadoAte) >= new Date(new Date().toDateString());
}

function EditMembroForm({
  membro,
  tipo,
  onSave,
  isPending,
}: {
  membro: RodizioCloserCarga | RodizioSdrCarga;
  tipo: 'closer' | 'sdr';
  onSave: (data: { ordem_rodizio: number | null; capacidade_max: number | null; afastado_ate: string | null }) => void;
  isPending: boolean;
}) {
  const [ordem, setOrdem] = useState(membro.ordem_rodizio ?? 0);
  const [capacidade, setCapacidade] = useState(membro.capacidade_max ?? 0);
  const [afastadoAte, setAfastadoAte] = useState(membro.afastado_ate ?? '');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Ordem no Rodízio</Label>
          <Input type="number" min={0} value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Capacidade Máxima</Label>
          <Input type="number" min={0} value={capacidade} onChange={(e) => setCapacidade(Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Palmtree className="h-3.5 w-3.5" /> Afastado até</Label>
        <Input type="date" value={afastadoAte} onChange={(e) => setAfastadoAte(e.target.value)} />
        <p className="text-xs text-muted-foreground">Deixe em branco para remover o afastamento</p>
      </div>
      <Button
        onClick={() =>
          onSave({
            ordem_rodizio: ordem || null,
            capacidade_max: capacidade || null,
            afastado_ate: afastadoAte || null,
          })
        }
        disabled={isPending}
        className="w-full"
      >
        Salvar Alterações
      </Button>
    </div>
  );
}

function CapacityBar({ current, max }: { current: number; max: number | null }) {
  const hasMax = typeof max === 'number' && max > 0;
  const pct = hasMax ? Math.min((current / max) * 100, 100) : 0;
  const colorClass = pct >= 90 ? 'text-destructive' : pct >= 70 ? 'text-warning' : 'text-muted-foreground';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Carteira</span>
        <span className={colorClass}>{current}{hasMax ? `/${max}` : ''}</span>
      </div>
      <Progress value={hasMax ? pct : 0} className="h-1.5" />
    </div>
  );
}

function CloserCard({ closer }: { closer: RodizioCloserCarga }) {
  const updateMembro = useUpdateRodizioMembro();
  const [editing, setEditing] = useState(false);

  return (
    <Card className={`border ${!closer.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <UserCircle className="h-8 w-8 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{closer.closer_nome}</span>
                <Badge variant="outline" className="text-success">Closer</Badge>
                {!closer.is_active && <Badge variant="secondary">Fora do rodízio</Badge>}
                {isAfastado(closer.afastado_ate) && (
                  <Badge variant="secondary"><Palmtree className="h-3 w-3 mr-1" />Afastado</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                <span>Ativos: {closer.total_ativo}</span>
                <span>Não ativados: {closer.total_nao_ativado}</span>
                <span>Inativos: {closer.total_inativo}</span>
                <span>Bloqueados: {closer.total_bloqueado}</span>
                <span className="flex items-center gap-0.5"><Snowflake className="h-3 w-3" />Pool frio: {closer.total_pool_frio}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-36">
              <CapacityBar current={closer.carga_atual} max={closer.capacidade_max} />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ordem</p>
              <p className="text-lg font-bold text-primary">{closer.ordem_rodizio ?? '—'}</p>
            </div>
            <div className="flex items-center gap-1">
              <Switch
                checked={closer.is_active}
                onCheckedChange={(v) => updateMembro.mutate({ id: closer.closer_id, tipo: 'closer', participa: v })}
                aria-label={`${closer.is_active ? 'Remover' : 'Incluir'} ${closer.closer_nome} do rodízio`}
              />
              <Dialog open={editing} onOpenChange={setEditing}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Editar"><Edit className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Editar {closer.closer_nome}</DialogTitle></DialogHeader>
                  <EditMembroForm
                    membro={closer}
                    tipo="closer"
                    isPending={updateMembro.isPending}
                    onSave={(data) => {
                      updateMembro.mutate({ id: closer.closer_id, tipo: 'closer', ...data });
                      setEditing(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SdrCard({ sdr }: { sdr: RodizioSdrCarga }) {
  const updateMembro = useUpdateRodizioMembro();
  const [editing, setEditing] = useState(false);

  return (
    <Card className={`border ${!sdr.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <UserCircle className="h-8 w-8 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{sdr.sdr_nome}</span>
                <Badge variant="outline" className="text-info">SDR</Badge>
                {!sdr.is_active && <Badge variant="secondary">Fora do rodízio</Badge>}
                {isAfastado(sdr.afastado_ate) && (
                  <Badge variant="secondary"><Palmtree className="h-3 w-3 mr-1" />Afastado</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                <span>Não ativados: {sdr.total_nao_ativado}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-36">
              <CapacityBar current={sdr.total_carteira} max={sdr.capacidade_max} />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ordem</p>
              <p className="text-lg font-bold text-primary">{sdr.ordem_rodizio ?? '—'}</p>
            </div>
            <div className="flex items-center gap-1">
              <Switch
                checked={sdr.is_active}
                onCheckedChange={(v) => updateMembro.mutate({ id: sdr.sdr_id, tipo: 'sdr', participa: v })}
                aria-label={`${sdr.is_active ? 'Remover' : 'Incluir'} ${sdr.sdr_nome} do rodízio`}
              />
              <Dialog open={editing} onOpenChange={setEditing}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Editar"><Edit className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Editar {sdr.sdr_nome}</DialogTitle></DialogHeader>
                  <EditMembroForm
                    membro={sdr}
                    tipo="sdr"
                    isPending={updateMembro.isPending}
                    onSave={(data) => {
                      updateMembro.mutate({ id: sdr.sdr_id, tipo: 'sdr', ...data });
                      setEditing(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalesTeamTab() {
  const { data, isLoading } = useRodizioEquipe();
  const { data: flags } = useRodizioConfigFlags();
  const closers = data?.closers ?? [];
  const sdrs = data?.sdrs ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  const activeClosers = closers.filter((c) => c.is_active).length;
  const activeSdrs = sdrs.filter((s) => s.is_active).length;

  return (
    <div className="space-y-4">
      {flags && (!flags.closerAtivo || !flags.sdrAtivo) && (
        <Card className="border border-warning/30 bg-warning/5">
          <CardContent className="p-3 text-xs text-warning flex flex-wrap gap-x-4 gap-y-1">
            <span>Kill switches (config_regras_negocio):</span>
            <span>RODIZIO_CLOSER_ATIVO: <strong>{flags.closerAtivo ? 'true' : 'false'}</strong></span>
            <span>RODIZIO_SDR_ATIVO: <strong>{flags.sdrAtivo ? 'true' : 'false'}</strong></span>
          </CardContent>
        </Card>
      )}

      <DashboardErrorBoundary sectionName="Simular Rodízio">
        <Suspense fallback={null}>
          <QuickDistributeWidget />
        </Suspense>
      </DashboardErrorBoundary>

      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">{closers.length + sdrs.length} membros</p>
        <div className="flex gap-1.5">
          <Badge variant="outline" className="text-xs text-info">{activeSdrs}/{sdrs.length} SDR</Badge>
          <Badge variant="outline" className="text-xs text-success">{activeClosers}/{closers.length} Closer</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Closers</h3>
        <div className="grid gap-3">
          {closers.map((c) => <CloserCard key={c.closer_id} closer={c} />)}
          {closers.length === 0 && (
            <Card className="border border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum closer participando do rodízio.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">SDRs</h3>
        <div className="grid gap-3">
          {sdrs.map((s) => <SdrCard key={s.sdr_id} sdr={s} />)}
          {sdrs.length === 0 && (
            <Card className="border border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum SDR participando do rodízio.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
