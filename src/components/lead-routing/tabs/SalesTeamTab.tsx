import React, { useState, useCallback, lazy, Suspense } from 'react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Edit, UserCircle, Palmtree, AlertTriangle, Users } from 'lucide-react';
import { useSalesTeam, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from '@/hooks/useSalesTeam';
import { ROLE_LABELS, ROLE_COLORS } from '@/types/leadRouting';
import type { SalesTeamMember, SalesRole } from '@/types/leadRouting';
import { Skeleton } from '@/components/ui/skeleton';

const QuickDistributeWidget = lazy(() => import('../QuickDistributeWidget'));

function MemberForm({
  initial,
  onSave,
  isPending,
}: {
  initial?: Partial<SalesTeamMember>;
  onSave: (data: Partial<SalesTeamMember>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role, setRole] = useState<SalesRole>(initial?.role ?? 'sdr');
  const [weight, setWeight] = useState(initial?.weight ?? 5);
  const [maxDay, setMaxDay] = useState(initial?.max_leads_day ?? 10);
  const [maxTotal, setMaxTotal] = useState(initial?.max_leads_total ?? 50);
  const [vacationStart, setVacationStart] = useState(initial?.vacation_start ?? '');
  const [vacationEnd, setVacationEnd] = useState(initial?.vacation_end ?? '');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      email: email.trim() || null,
      role, weight,
      max_leads_day: maxDay,
      max_leads_total: maxTotal,
      vacation_start: vacationStart || null,
      vacation_end: vacationEnd || null,
    });
  }, [name, email, role, weight, maxDay, maxTotal, vacationStart, vacationEnd, onSave]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nome *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do vendedor" />
        </div>
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Papel</Label>
          <Select value={role} onValueChange={(v) => setRole(v as SalesRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sdr">SDR</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
              <SelectItem value="manager">Gerente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Cap Diário</Label>
          <Input type="number" min={1} max={100} value={maxDay} onChange={(e) => setMaxDay(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Cap Total</Label>
          <Input type="number" min={1} max={500} value={maxTotal} onChange={(e) => setMaxTotal(Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Peso no Rodízio: <span className="font-bold text-primary">{weight}</span></Label>
        <Slider min={1} max={10} step={1} value={[weight]} onValueChange={([v]) => setWeight(v)} className="mt-2" />
        <p className="text-xs text-muted-foreground">Maior peso = mais leads recebidos proporcionalmente</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Palmtree className="h-3.5 w-3.5" /> Início Férias</Label>
          <Input type="date" value={vacationStart} onChange={(e) => setVacationStart(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Fim Férias</Label>
          <Input type="date" value={vacationEnd} onChange={(e) => setVacationEnd(e.target.value)} min={vacationStart || undefined} />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={!name.trim() || isPending} className="w-full">
        {initial?.id ? 'Atualizar Membro' : 'Adicionar Membro'}
      </Button>
    </div>
  );
}

function DeleteConfirmDialog({
  member,
  onConfirm,
  isPending,
}: {
  member: SalesTeamMember;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Remover"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja remover <strong>{member.name}</strong> da equipe?
          {member.current_lead_count > 0 && (
            <span className="block mt-2 text-destructive">
              ⚠ Este membro possui {member.current_lead_count} leads ativos que precisarão ser redistribuídos.
            </span>
          )}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); setOpen(false); }} disabled={isPending}>
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CapacityBar({ current, max, label }: { current: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const colorClass = pct >= 90 ? 'text-destructive' : pct >= 70 ? 'text-warning' : 'text-muted-foreground';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={colorClass}>{current}/{max}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

export default function SalesTeamTab() {
  const { data: members = [], isLoading } = useSalesTeam();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  const isOnVacation = (m: SalesTeamMember) => {
    if (!m.vacation_start || !m.vacation_end) return false;
    const now = new Date();
    return now >= new Date(m.vacation_start) && now <= new Date(m.vacation_end);
  };

  const sdrs = members.filter((m) => m.role === 'sdr');
  const closers = members.filter((m) => m.role === 'closer');
  const managers = members.filter((m) => m.role === 'manager');

  return (
    <div className="space-y-4">
      <DashboardErrorBoundary sectionName="Distribuição Rápida">
        <Suspense fallback={null}>
          <QuickDistributeWidget />
        </Suspense>
      </DashboardErrorBoundary>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{members.length} membros</p>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-xs text-info">{sdrs.length} SDR</Badge>
            <Badge variant="outline" className="text-xs text-success">{closers.length} Closer</Badge>
            {managers.length > 0 && <Badge variant="outline" className="text-xs text-warning">{managers.length} Gerente</Badge>}
          </div>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Membro da Equipe</DialogTitle></DialogHeader>
            <MemberForm
              onSave={(data) => { createMember.mutate(data); setShowForm(false); }}
              isPending={createMember.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {members.map((m) => (
          <Card key={m.id} className={`border ${!m.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <UserCircle className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{m.name}</span>
                      <Badge variant="outline" className={ROLE_COLORS[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                      {!m.is_active && <Badge variant="secondary">Inativo</Badge>}
                      {isOnVacation(m) && (
                        <Badge variant="secondary"><Palmtree className="h-3 w-3 mr-1" />Férias</Badge>
                      )}
                    </div>
                    {m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-32 space-y-1.5">
                    <CapacityBar current={m.leads_today} max={m.max_leads_day} label="Hoje" />
                    <CapacityBar current={m.current_lead_count} max={m.max_leads_total} label="Total" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="text-lg font-bold text-primary">{m.weight}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={m.is_active}
                      onCheckedChange={(v) => updateMember.mutate({ id: m.id, is_active: v })}
                      aria-label={`${m.is_active ? 'Desativar' : 'Ativar'} ${m.name}`}
                    />
                    <Dialog open={editingId === m.id} onOpenChange={(o) => setEditingId(o ? m.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Editar"><Edit className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Editar {m.name}</DialogTitle></DialogHeader>
                        <MemberForm
                          initial={m}
                          onSave={(data) => { updateMember.mutate({ id: m.id, ...data }); setEditingId(null); }}
                          isPending={updateMember.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    <DeleteConfirmDialog
                      member={m}
                      onConfirm={() => deleteMember.mutate(m.id)}
                      isPending={deleteMember.isPending}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhum membro cadastrado</p>
              <p className="text-xs mt-1">Adicione vendedores SDR e Closers para iniciar a distribuição de leads.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
