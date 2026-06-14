import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHandoffQueue, useCreateHandoff, useRespondHandoff } from '@/hooks/useHandoffQueue';
import { useSalesTeam } from '@/hooks/useSalesTeam';
import { STATUS_LABELS } from '@/types/leadRouting';
import type { HandoffRequest, SalesTeamMember, QualificationData } from '@/types/leadRouting';
import { Check, X, ArrowRight, Clock, Inbox, Plus, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ─── BANT Qualification Badges ─── */
function QualificationBadges({ data }: { data: HandoffRequest['qualification_data'] }) {
  if (!data) return null;
  const items = [
    data.budget && { label: 'Budget', value: data.budget },
    data.authority && { label: 'Autoridade', value: data.authority },
    data.need && { label: 'Necessidade', value: data.need },
    data.timeline && { label: 'Timeline', value: data.timeline },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map((item) => (
        <Badge key={item.label} variant="outline" className="text-xs">
          {item.label}: {item.value}
        </Badge>
      ))}
      {data.relationship_score != null && (
        <Badge variant="secondary" className="text-xs">
          Score: {data.relationship_score}
        </Badge>
      )}
      {data.disc_profile && (
        <Badge variant="secondary" className="text-xs">
          DISC: {data.disc_profile}
        </Badge>
      )}
    </div>
  );
}

/* ─── Create Handoff Form ─── */
function CreateHandoffForm({
  members,
  onSubmit,
  isPending,
}: {
  members: SalesTeamMember[];
  onSubmit: (data: {
    fromMemberId: string;
    toMemberId?: string;
    qualificationData: QualificationData;
    reason?: string;
    notes?: string;
  }) => void;
  isPending: boolean;
}) {
  const sdrs = members.filter((m) => m.role === 'sdr' && m.is_active);
  const closers = members.filter((m) => m.role === 'closer' && m.is_active);

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [authority, setAuthority] = useState('');
  const [need, setNeed] = useState('');
  const [timeline, setTimeline] = useState('');
  const [discProfile, setDiscProfile] = useState('');
  const [relationshipScore, setRelationshipScore] = useState(5);

  const handleSubmit = useCallback(() => {
    if (!fromId) return;
    onSubmit({
      fromMemberId: fromId,
      toMemberId: toId && toId !== '__any__' ? toId : undefined,
      reason: reason || undefined,
      notes: notes || undefined,
      qualificationData: {
        budget: budget || undefined,
        authority: authority || undefined,
        need: need || undefined,
        timeline: timeline || undefined,
        disc_profile: discProfile || undefined,
        relationship_score: relationshipScore,
      },
    });
  }, [fromId, toId, reason, notes, budget, authority, need, timeline, discProfile, relationshipScore, onSubmit]);

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>SDR de Origem *</Label>
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger><SelectValue placeholder="Selecione o SDR" /></SelectTrigger>
            <SelectContent>
              {sdrs.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Closer Destino</Label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger><SelectValue placeholder="Qualquer closer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Qualquer Closer</SelectItem>
              {closers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Motivo do Handoff</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Lead qualificado para fechamento" />
      </div>

      {/* BANT Section */}
      <div className="rounded-lg border p-3 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualificação BANT</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Budget (Orçamento)</Label>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="estimated">Estimado</SelectItem>
                <SelectItem value="unknown">Desconhecido</SelectItem>
                <SelectItem value="insufficient">Insuficiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Authority (Autoridade)</Label>
            <Select value={authority} onValueChange={setAuthority}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="decision_maker">Decisor</SelectItem>
                <SelectItem value="influencer">Influenciador</SelectItem>
                <SelectItem value="evaluator">Avaliador</SelectItem>
                <SelectItem value="unknown">Desconhecido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Need (Necessidade)</Label>
            <Select value={need} onValueChange={setNeed}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="important">Importante</SelectItem>
                <SelectItem value="nice_to_have">Desejável</SelectItem>
                <SelectItem value="exploring">Explorando</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Timeline (Prazo)</Label>
            <Select value={timeline} onValueChange={setTimeline}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Imediato</SelectItem>
                <SelectItem value="this_quarter">Este trimestre</SelectItem>
                <SelectItem value="next_quarter">Próximo trimestre</SelectItem>
                <SelectItem value="undefined">Indefinido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Perfil DISC</Label>
          <Select value={discProfile} onValueChange={setDiscProfile}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="D">D - Dominância</SelectItem>
              <SelectItem value="I">I - Influência</SelectItem>
              <SelectItem value="S">S - Estabilidade</SelectItem>
              <SelectItem value="C">C - Conformidade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Score Relacionamento: <span className="font-bold text-primary">{relationshipScore}</span></Label>
          <Slider min={1} max={10} step={1} value={[relationshipScore]} onValueChange={([v]) => setRelationshipScore(v)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informações adicionais para o closer..." rows={2} />
      </div>

      <Button onClick={handleSubmit} disabled={!fromId || isPending} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        Solicitar Handoff
      </Button>
    </div>
  );
}

/* ─── Status helpers ─── */
function statusColor(status: HandoffRequest['status']): string {
  const map: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/30',
    accepted: 'bg-success/10 text-success border-success/30',
    rejected: 'bg-destructive/10 text-destructive border-destructive/30',
    expired: 'bg-muted text-muted-foreground',
    cancelled: 'bg-muted text-muted-foreground',
  };
  return map[status] ?? '';
}

function getMemberName(id: string, membersMap: Map<string, SalesTeamMember>): string {
  return membersMap.get(id)?.name ?? 'Desconhecido';
}

/* ─── Main Tab ─── */
export default function HandoffQueueTab() {
  const { data: handoffs = [], isLoading } = useHandoffQueue();
  const { data: members = [] } = useSalesTeam();
  const createHandoff = useCreateHandoff();
  const respond = useRespondHandoff();
  const [showCreate, setShowCreate] = useState(false);

  const membersMap = useMemo(() => {
    const map = new Map<string, SalesTeamMember>();
    if (Array.isArray(members)) {
      members.forEach((m) => map.set(m.id, m));
    }
    return map;
  }, [members]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  const pending = handoffs.filter((h) => h.status === 'pending');
  const resolved = handoffs.filter((h) => h.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          Pendentes ({pending.length})
        </h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Novo Handoff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitar Handoff SDR → Closer</DialogTitle>
            </DialogHeader>
            <CreateHandoffForm
              members={Array.isArray(members) ? members : []}
              onSubmit={(data) => {
                createHandoff.mutate(data);
                setShowCreate(false);
              }}
              isPending={createHandoff.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {pending.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum handoff pendente</p>
            <p className="text-xs mt-1">Handoffs SDR → Closer aparecerão aqui quando solicitados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pending.map((h) => (
            <Card key={h.id} className="border border-warning/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-medium">{getMemberName(h.from_member_id, membersMap)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium">
                        {h.to_member_id ? getMemberName(h.to_member_id, membersMap) : 'Qualquer Closer'}
                      </span>
                      <Badge className={statusColor(h.status)}>{STATUS_LABELS[h.status]}</Badge>
                    </div>
                    {h.handoff_reason && (
                      <p className="text-xs text-muted-foreground mt-1">{h.handoff_reason}</p>
                    )}
                    <QualificationBadges data={h.qualification_data} />
                    {h.notes && <p className="text-xs mt-2 italic text-muted-foreground">{h.notes}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                      {' · SLA: '}{h.sla_hours}h
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => respond.mutate({ id: h.id, action: 'accept' })}
                      disabled={respond.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respond.mutate({ id: h.id, action: 'reject' })}
                      disabled={respond.isPending}
                    >
                      <X className="h-4 w-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Histórico ({resolved.length})</h3>
          <div className="space-y-2">
            {resolved.slice(0, 20).map((h) => (
              <Card key={h.id} className="border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className={statusColor(h.status)}>{STATUS_LABELS[h.status]}</Badge>
                      <span className="text-muted-foreground">
                        {getMemberName(h.from_member_id, membersMap)} → {h.to_member_id ? getMemberName(h.to_member_id, membersMap) : '—'}
                      </span>
                      {h.handoff_reason && <span className="text-muted-foreground text-xs">· {h.handoff_reason}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
