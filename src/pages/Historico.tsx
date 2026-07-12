import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, MessageSquare, Phone, Mail, Users, StickyNote, Share2, Search, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EntityPicker } from '@/pages/cadastro/EntityPicker';
import { useUnifiedHistory, type HistoryChannel, type HistoryItem } from '@/hooks/useUnifiedHistory';

const CHANNEL_META: Record<HistoryChannel, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare },
  call: { label: 'Ligação', icon: Phone },
  email: { label: 'Email', icon: Mail },
  meeting: { label: 'Reunião', icon: Users },
  note: { label: 'Nota', icon: StickyNote },
  social: { label: 'Social', icon: Share2 },
};

const ALL_CHANNELS: HistoryChannel[] = ['whatsapp', 'call', 'email', 'meeting', 'note', 'social'];

function formatDuration(sec?: number | null): string | null {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const meta = CHANNEL_META[item.channel];
  const Icon = meta.icon;
  const dur = formatDuration(item.duration_seconds);
  const DirIcon = item.direction === 'inbound' ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="flex gap-3 rounded-md border border-border bg-card p-3 hover:bg-accent/40 transition-colors">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{meta.label}</span>
          <Badge variant="outline" className="gap-1 py-0 text-[10px]">
            <DirIcon className="h-3 w-3" />
            {item.direction === 'inbound' ? 'Recebida' : item.direction === 'outbound' ? 'Enviada' : '—'}
          </Badge>
          {item.status && <Badge variant="secondary" className="py-0 text-[10px]">{item.status}</Badge>}
          {dur && <span>· {dur}</span>}
          <span className="ml-auto">
            {format(new Date(item.timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        <p className="truncate text-sm text-foreground">{item.title}</p>
        {item.preview && <p className="line-clamp-2 text-sm text-muted-foreground">{item.preview}</p>}
        {item.audio_url && (
          <audio controls preload="none" className="mt-1 h-8 w-full max-w-sm">
            <source src={item.audio_url} />
          </audio>
        )}
      </div>
    </div>
  );
}

export default function Historico() {
  const [search, setSearch] = useState('');
  const [contact, setContact] = useState<{ id: string; label: string } | null>(null);
  const [company, setCompany] = useState<{ id: string; label: string } | null>(null);
  const [channels, setChannels] = useState<HistoryChannel[]>([]);
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    contactId: contact?.id ?? null,
    companyId: company?.id ?? null,
    channels: channels.length ? channels : undefined,
    from: from ? from.toISOString() : null,
    to: to ? new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : null,
    limit: 200,
  }), [search, contact, company, channels, from, to]);

  const { data = [], isLoading, isError, error, refetch } = useUnifiedHistory(filters);

  const toggleChannel = (c: HistoryChannel) => {
    setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const clearAll = () => {
    setSearch(''); setContact(null); setCompany(null); setChannels([]); setFrom(undefined); setTo(undefined);
  };

  const counters = useMemo(() => {
    const acc: Record<HistoryChannel, number> = { whatsapp: 0, call: 0, email: 0, meeting: 0, note: 0, social: 0 };
    for (const it of data) acc[it.channel]++;
    return acc;
  }, [data]);

  return (
    <div className="container mx-auto space-y-4 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Histórico Unificado</h1>
        <p className="text-sm text-muted-foreground">
          Ligações, mensagens de WhatsApp, emails, reuniões e notas em uma única linha do tempo.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por texto..."
                className="pl-8"
              />
            </div>
            <EntityPicker label="Pessoa" entityType="contact" value={contact} onChange={setContact} />
            <EntityPicker label="Empresa" entityType="company" value={company} onChange={setCompany} />
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('justify-start text-left font-normal', !from && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {from ? format(from, 'dd/MM/yy') : 'De'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus className="pointer-events-auto p-3" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('justify-start text-left font-normal', !to && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {to ? format(to, 'dd/MM/yy') : 'Até'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={to} onSelect={setTo} initialFocus className="pointer-events-auto p-3" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ALL_CHANNELS.map((c) => {
              const active = channels.includes(c);
              const Icon = CHANNEL_META[c].icon;
              return (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  onClick={() => toggleChannel(c)}
                  className="gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {CHANNEL_META[c].label}
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{counters[c]}</Badge>
                </Button>
              );
            })}
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button size="sm" variant="ghost" onClick={clearAll} className="gap-1">
              <X className="h-3.5 w-3.5" /> Limpar
            </Button>
            <span className="ml-auto text-sm text-muted-foreground">{data.length} registros</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Carregando histórico...</p>}
          {isError && (
            <div className="p-4 text-sm">
              <p className="text-destructive">Erro ao carregar histórico: {(error as Error).message}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
            </div>
          )}
          {!isLoading && !isError && data.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado para os filtros selecionados.</p>
          )}
          {!isLoading && data.length > 0 && (
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <div className="space-y-2 pr-2">
                {data.map((it) => <HistoryRow key={it.id} item={it} />)}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
