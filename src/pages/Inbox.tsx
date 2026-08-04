import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useInteractions } from '@/hooks/useInteractions';
import { useOverdueTasks, usePendingTasks, useCompleteTask, useReopenTask } from '@/hooks/useTasks';
import { useActionToast } from '@/hooks/useActionToast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Mail, MessageSquare, Phone, CheckSquare, Bell,
  AlertTriangle, ArrowRight, Trophy, Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ChannelFilter = 'all' | 'task' | 'email' | 'whatsapp' | 'call';

interface InboxItem {
  id: string;
  kind: 'task-overdue' | 'task-pending' | 'interaction-followup' | 'interaction-negative';
  title: string;
  subtitle?: string;
  channel: 'task' | 'email' | 'whatsapp' | 'call' | 'note' | 'meeting';
  priorityScore: number; // 0-100
  occurredAt: string;
  href?: string;
  raw: unknown;
}

const CHANNEL_META: Record<InboxItem['channel'], { label: string; Icon: typeof Mail; cls: string }> = {
  task: { label: 'Tarefa', Icon: CheckSquare, cls: 'text-warning' },
  email: { label: 'Email', Icon: Mail, cls: 'text-info' },
  whatsapp: { label: 'WhatsApp', Icon: MessageSquare, cls: 'text-success' },
  call: { label: 'Ligação', Icon: Phone, cls: 'text-primary' },
  note: { label: 'Nota', Icon: Bell, cls: 'text-muted-foreground' },
  meeting: { label: 'Reunião', Icon: Bell, cls: 'text-info' },
};

const KIND_META: Record<InboxItem['kind'], { label: string; cls: string }> = {
  'task-overdue': { label: 'Tarefa vencida', cls: 'text-destructive' },
  'task-pending': { label: 'Tarefa pendente', cls: 'text-warning' },
  'interaction-followup': { label: 'Follow-up', cls: 'text-warning' },
  'interaction-negative': { label: 'Sinal negativo', cls: 'text-destructive' },
};

function channelFromInteractionType(t: string | null): InboxItem['channel'] {
  const v = (t ?? '').toLowerCase();
  if (v.includes('whats')) return 'whatsapp';
  if (v.includes('email')) return 'email';
  if (v.includes('call') || v.includes('liga')) return 'call';
  if (v.includes('meet') || v.includes('reuni')) return 'meeting';
  return 'note';
}

function Inbox() {
  usePageTitle('Inbox');
  const { interactions, loading: loadingInter } = useInteractions();
  const { data: overdue = [], isLoading: loadingOverdue } = useOverdueTasks();
  const { data: pending = [], isLoading: loadingPending } = usePendingTasks();
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();
  const { destructive } = useActionToast();

  const [filter, setFilter] = useState<ChannelFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const items = useMemo<InboxItem[]>(() => {
    const list: InboxItem[] = [];

    overdue.forEach((t) => {
      list.push({
        id: `task-overdue-${t.id}`,
        kind: 'task-overdue',
        title: t.title,
        subtitle: t.contact_name ?? t.company_name ?? undefined,
        channel: 'task',
        priorityScore: 95,
        occurredAt: t.due_date ?? t.created_at,
        raw: t,
      });
    });

    pending.forEach((t) => {
      const isOverdue = overdue.some((o) => o.id === t.id);
      if (isOverdue) return;
      list.push({
        id: `task-pending-${t.id}`,
        kind: 'task-pending',
        title: t.title,
        subtitle: t.contact_name ?? t.company_name ?? undefined,
        channel: 'task',
        priorityScore: t.priority === 'high' || t.priority === 'urgent' ? 75 : 55,
        occurredAt: t.due_date ?? t.created_at,
        raw: t,
      });
    });

    interactions.forEach((i) => {
      if (i.follow_up_required) {
        list.push({
          id: `inter-followup-${i.id}`,
          kind: 'interaction-followup',
          title: i.title || 'Follow-up pendente',
          subtitle: i.content?.slice(0, 90) ?? undefined,
          channel: channelFromInteractionType(i.type),
          priorityScore: 70,
          occurredAt: i.created_at,
          href: i.contact_id ? `/contatos/${i.contact_id}` : undefined,
          raw: i,
        });
      } else if ((i.sentiment ?? '').toLowerCase() === 'negative') {
        list.push({
          id: `inter-neg-${i.id}`,
          kind: 'interaction-negative',
          title: i.title || 'Sinal negativo detectado',
          subtitle: i.content?.slice(0, 90) ?? undefined,
          channel: channelFromInteractionType(i.type),
          priorityScore: 80,
          occurredAt: i.created_at,
          href: i.contact_id ? `/contatos/${i.contact_id}` : undefined,
          raw: i,
        });
      }
    });

    return list
      .filter((it) => filter === 'all' || it.channel === filter)
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [overdue, pending, interactions, filter]);

  const counts = useMemo(() => ({
    all: items.length,
    task: items.filter((i) => i.channel === 'task').length,
    email: items.filter((i) => i.channel === 'email').length,
    whatsapp: items.filter((i) => i.channel === 'whatsapp').length,
    call: items.filter((i) => i.channel === 'call').length,
  }), [items]);

  const loading = loadingInter || loadingOverdue || loadingPending;
  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null;

  const handleCompleteTask = (taskId: string) => {
    completeTask.mutate(taskId);
    setSelectedId(null);
    destructive({
      message: 'Tarefa concluída! 🎉',
      onUndo: () => reopenTask.mutate(taskId),
    });
  };

  const isInboxZero = !loading && items.length === 0;

  return (
    <AppLayout>
      <SEOHead title="Inbox" description="Caixa unificada de prioridades, follow-ups e tarefas" />
      <Header title="Inbox" subtitle={loading ? 'Carregando…' : `${items.length} item${items.length === 1 ? '' : 's'} pendente${items.length === 1 ? '' : 's'}`} hideBack />

      <div className="px-4 md:px-6 pb-6 space-y-3">
        {/* Filtros por canal */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {(['all', 'task', 'email', 'whatsapp', 'call'] as const).map((f) => (
            <Button
              key={f}
              type="button"
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : CHANNEL_META[f].label}
              <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
                {counts[f]}
              </Badge>
            </Button>
          ))}
        </div>

        {isInboxZero ? (
          <InboxZero />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,380px)_1fr] gap-3">
            {/* Lista */}
            <Card className="overflow-hidden">
              <ScrollArea className="h-[calc(100dvh-260px)] lg:h-[calc(100dvh-220px)]">
                {loading && (
                  <div className="p-3 space-y-2">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                )}
                {!loading && items.map((it) => {
                  const c = CHANNEL_META[it.channel];
                  const k = KIND_META[it.kind];
                  const isActive = (selected?.id ?? items[0]?.id) === it.id;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(it.id);
                        if (window.matchMedia('(max-width: 1023px)').matches) setMobilePreviewOpen(true);
                      }}
                      className={cn(
                        'w-full text-left p-3 border-b border-border/50 hover:bg-muted/50 transition-colors',
                        isActive && 'bg-muted',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <c.Icon className={cn('h-3.5 w-3.5', c.cls)} />
                        <span className={cn('text-[10px] font-semibold uppercase', k.cls)}>{k.label}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(it.occurredAt), { locale: ptBR, addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{it.title}</p>
                      {it.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{it.subtitle}</p>
                      )}
                    </button>
                  );
                })}
              </ScrollArea>
            </Card>

            {/* Preview */}
            <Card className="hidden lg:block">
              <CardContent className="p-5">
                {!selected ? (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    Selecione um item à esquerda para ver detalhes
                  </p>
                ) : (
                  <InboxPreview item={selected} onCompleteTask={handleCompleteTask} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Drawer mobile com preview */}
      <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <SheetContent side="bottom" className="lg:hidden h-[85dvh] overflow-y-auto">
          <SheetHeader className="mb-3">
            <SheetTitle>Detalhes</SheetTitle>
          </SheetHeader>
          {selected && (
            <InboxPreview
              item={selected}
              onCompleteTask={(id) => { handleCompleteTask(id); setMobilePreviewOpen(false); }}
            />
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function InboxPreview({
  item,
  onCompleteTask,
}: {
  item: InboxItem;
  onCompleteTask: (id: string) => void;
}) {
  const c = CHANNEL_META[item.channel];
  const k = KIND_META[item.kind];
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <c.Icon className={cn('h-3.5 w-3.5', c.cls)} />
            <span className={cn('font-semibold uppercase', k.cls)}>{k.label}</span>
            <Badge variant="outline" className="text-[10px]">{c.label}</Badge>
          </div>
          <h2 className="text-lg font-semibold truncate">{item.title}</h2>
          {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.occurredAt), { locale: ptBR, addSuffix: true })}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 gap-1">
          <AlertTriangle className="h-3 w-3" /> {item.priorityScore}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
        {item.kind.startsWith('task') && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              const raw = item.raw as { id: string };
              onCompleteTask(raw.id);
            }}
          >
            <CheckSquare className="h-3.5 w-3.5" /> Concluir tarefa
          </Button>
        )}
        {item.href && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to={item.href}>
              Abrir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" size="sm" className="gap-1.5 ml-auto">
          <Link to="/tarefas">Ver todas as tarefas</Link>
        </Button>
      </div>
    </div>
  );
}

function InboxZero() {
  return (
    <Card className="bg-success/5 border-success/30">
      <CardContent className="py-12 text-center space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
          <Trophy className="h-7 w-7 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Inbox Zero! 🎉</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Você está em dia com suas tarefas e follow-ups. Aproveite para prospectar ou estudar uma conta.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/pipeline">Ver pipeline</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/contatos">Prospectar contatos</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Inbox;
