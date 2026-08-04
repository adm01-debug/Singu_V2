import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Ticket, AlertTriangle, Clock, CheckCircle2, Filter, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { CannedResponsesPanel } from '@/components/support/CannedResponsesPanel';
import { TicketDetailDrawer } from '@/components/support/TicketDetailDrawer';
import { SLABadge } from '@/components/support/SLABadge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// SLA hours by priority — auto-assigned on ticket creation
const SLA_HOURS: Record<SupportTicket['priority'], number> = {
  urgent: 2,
  high: 8,
  medium: 24,
  low: 72,
};

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'bg-primary/10 text-primary border-primary/20' },
  medium: { label: 'Média', color: 'bg-warning/10 text-warning-foreground border-warning/20' },
  high: { label: 'Alta', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  urgent: { label: 'Urgente', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const STATUS_CONFIG = {
  open: { label: 'Aberto', icon: Ticket, color: 'text-primary' },
  in_progress: { label: 'Em Andamento', icon: Clock, color: 'text-warning' },
  waiting: { label: 'Aguardando', icon: AlertTriangle, color: 'text-orange-500' },
  resolved: { label: 'Resolvido', icon: CheckCircle2, color: 'text-success' },
  closed: { label: 'Fechado', icon: CheckCircle2, color: 'text-muted-foreground' },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Geral',
  bug: 'Bug',
  feature: 'Funcionalidade',
  billing: 'Financeiro',
  support: 'Suporte',
  complaint: 'Reclamação',
  onboarding: 'Onboarding',
};

export default function Suporte() {
  const { tickets, isLoading, create, update } = useSupportTickets();
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // New ticket form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [category, setCategory] = useState('general');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, search]);

  const stats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const urgent = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length;
    const overdue = tickets.filter(t =>
      t.sla_deadline && !t.resolved_at && new Date(t.sla_deadline).getTime() < Date.now()
    ).length;
    return { open, inProgress, resolved, urgent, overdue };
  }, [tickets]);

  const handleCreate = () => {
    if (!title.trim()) return;
    const slaHours = SLA_HOURS[priority];
    const sla_deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();
    create.mutate({ title, description, priority, category, sla_deadline });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('general');
    setShowNew(false);
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Suporte | SINGU</title>
        <meta name="description" content="Sistema de tickets e chamados de suporte ao cliente." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader backTo="/" backLabel="Dashboard" title="Suporte & Chamados" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Abertos', value: stats.open, icon: Ticket, color: 'text-primary' },
            { label: 'Em Andamento', value: stats.inProgress, icon: Clock, color: 'text-warning' },
            { label: 'Resolvidos', value: stats.resolved, icon: CheckCircle2, color: 'text-success' },
            { label: 'Urgentes', value: stats.urgent, icon: AlertTriangle, color: 'text-destructive' },
            { label: 'SLA Vencido', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Prioridade</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowNew(true)} className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Novo Ticket
          </Button>
        </div>

        {/* Ticket List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum ticket encontrado.</p>
            ) : (
              <div className="divide-y">
                {filtered.map(ticket => {
                  const status = STATUS_CONFIG[ticket.status];
                  const prio = PRIORITY_CONFIG[ticket.priority];
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusIcon className={`h-4 w-4 shrink-0 ${status.color}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{ticket.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] h-4 ${prio.color}`}>{prio.label}</Badge>
                            <Badge variant="secondary" className="text-[10px] h-4">{CATEGORY_LABELS[ticket.category] || ticket.category}</Badge>
                            <SLABadge deadline={ticket.sla_deadline} resolvedAt={ticket.resolved_at} />
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={ticket.status}
                          onValueChange={v => update.mutate({ id: ticket.id, status: v as SupportTicket['status'] })}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Canned Responses */}
        <CannedResponsesPanel />

        {/* New Ticket Dialog */}
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Ticket</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Descreva o problema..." className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes..." className="text-xs min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Prioridade</Label>
                  <Select value={priority} onValueChange={v => setPriority(v as SupportTicket['priority'])}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)} className="text-xs">Cancelar</Button>
              <Button onClick={handleCreate} disabled={!title.trim() || create.isPending} className="text-xs">Criar Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ticket Detail Drawer */}
        <TicketDetailDrawer
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      </div>
    </AppLayout>
  );
}
