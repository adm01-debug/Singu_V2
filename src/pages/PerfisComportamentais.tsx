import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkles, Search, Filter, Building2, MessageCircle, TrendingUp, Heart, X, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  applyBehavioralFilters,
  useBehavioralProfilesFacets,
  useBehavioralProfilesList,
  type BehavioralProfileListItem,
  type BehavioralProfilesFilters,
} from '@/hooks/useBehavioralProfilesList';

const SENTIMENT_LABEL: Record<string, string> = {
  positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo', mixed: 'Misto',
};

const PERIOD_OPTIONS: Array<{ value: NonNullable<BehavioralProfilesFilters['period']>; label: string }> = [
  { value: 'all', label: 'Todos os períodos' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
];

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function ProfileRow({ item }: { item: BehavioralProfileListItem }) {
  return (
    <Link
      to={`/contatos/${item.contact_id}`}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            {item.contact_avatar && <AvatarImage src={item.contact_avatar} alt={item.contact_name ?? ''} />}
            <AvatarFallback className="text-xs">{initials(item.contact_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{item.contact_name ?? 'Contato sem nome'}</p>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            {item.company_name && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" /> {item.company_name}
              </p>
            )}
          </div>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(item.last_updated_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>

      {item.summary && (
        <p className="line-clamp-2 text-sm text-foreground/90">{item.summary}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {item.tone && (
          <Badge variant="secondary" className="gap-1"><MessageCircle className="h-3 w-3" /> {item.tone}</Badge>
        )}
        {item.communication_style && <Badge variant="secondary">{item.communication_style}</Badge>}
        {item.sentiment_trend && (
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" /> {SENTIMENT_LABEL[item.sentiment_trend] ?? item.sentiment_trend}
          </Badge>
        )}
        {item.hobbies.slice(0, 2).map((h, i) => (
          <Badge key={`h-${i}`} variant="outline" className="gap-1"><Heart className="h-3 w-3" /> {h.label}</Badge>
        ))}
        {item.recurrent_topics.slice(0, 3).map((t, i) => (
          <Badge key={`t-${i}`} variant="outline">{t}</Badge>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Baseado em {item.based_on_count} interações{item.model ? ` · ${item.model}` : ''}
      </p>
    </Link>
  );
}

export default function PerfisComportamentais() {
  const [period, setPeriod] = useState<NonNullable<BehavioralProfilesFilters['period']>>('all');
  const [companyId, setCompanyId] = useState<string>('all');
  const [tone, setTone] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filters: BehavioralProfilesFilters = useMemo(
    () => ({ period, companyId: companyId === 'all' ? null : companyId, tone: tone === 'all' ? null : tone, search }),
    [period, companyId, tone, search],
  );

  const { data: allItems = [], isLoading, error, refetch } = useBehavioralProfilesList({ period });
  const filtered = useMemo(() => applyBehavioralFilters(allItems, filters), [allItems, filters]);
  const facets = useBehavioralProfilesFacets(allItems);

  const hasFilters = companyId !== 'all' || tone !== 'all' || search.trim() !== '' || period !== 'all';

  return (
    <div className="container mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-5 w-5 text-primary" /> Perfis Comportamentais
        </h1>
        <p className="text-sm text-muted-foreground">
          Painel executivo com todos os perfis gerados por IA, filtráveis por empresa, período de atualização e tom.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
          <CardDescription>Refine a lista abaixo. {filtered.length} de {allItems.length} perfis exibidos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar contato, empresa ou resumo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {facets.companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.count})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue placeholder="Tom de comunicação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tons</SelectItem>
              {facets.tones.map((t) => (
                <SelectItem key={t.tone} value={t.tone}>{t.tone} ({t.count})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <div className="md:col-span-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setPeriod('all'); setCompanyId('all'); setTone('all'); setSearch(''); }}
              >
                <X className="mr-1.5 h-3.5 w-3.5" /> Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <span className="text-destructive">Erro ao carregar perfis: {(error as Error).message}</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <Sparkles className="h-6 w-6 text-muted-foreground/60" />
            <p>Nenhum perfil comportamental encontrado com estes filtros.</p>
            <p className="text-xs">Gere perfis a partir da ficha de cada contato para vê-los aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)] pr-2">
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((item) => <ProfileRow key={item.id} item={item} />)}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}