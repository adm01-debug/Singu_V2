import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle, ArrowRight, Copy, Building2, Users, RefreshCw, ShieldCheck, Search,
} from 'lucide-react';
import { useDedupEngine, type DedupEntity } from '@/hooks/useDedupEngine';
import { useMergeRecords } from '@/hooks/useMergeRecords';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { DuplicatePair } from '@/lib/fuzzyDedup';

function PairRow({ pair, onMerge }: { pair: DuplicatePair; onMerge: (p: DuplicatePair) => void }) {
  const sev = pair.score >= 0.95 ? 'destructive' : pair.score >= 0.88 ? 'default' : 'secondary';
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/40 transition-colors">
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-3 items-center">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{pair.a.name || '—'}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {pair.a.email || pair.a.phone || pair.a.cnpj || pair.a.id.slice(0, 8)}
          </p>
        </div>
        <div className="min-w-0 flex items-center gap-2">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{pair.b.name || '—'}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {pair.b.email || pair.b.phone || pair.b.cnpj || pair.b.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant={sev}>{Math.round(pair.score * 100)}%</Badge>
        <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[180px] text-right">
          {pair.reasons.slice(0, 2).join(' • ')}
        </span>
      </div>
      <Button size="sm" variant="outline" onClick={() => onMerge(pair)}>
        Mesclar
      </Button>
    </div>
  );
}

function DedupTab({ entity }: { entity: DedupEntity }) {
  const [threshold, setThreshold] = useState(0.85);
  const [filter, setFilter] = useState('');
  const { pairs, isLoading, isFetching, totalScanned, refetch } = useDedupEngine(entity, threshold);
  const merge = useMergeRecords();
  const [active, setActive] = useState<DuplicatePair | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return pairs;
    const f = filter.toLowerCase();
    return pairs.filter(p =>
      (p.a.name ?? '').toLowerCase().includes(f) ||
      (p.b.name ?? '').toLowerCase().includes(f) ||
      (p.a.email ?? '').toLowerCase().includes(f) ||
      (p.b.email ?? '').toLowerCase().includes(f)
    );
  }, [pairs, filter]);

  const handleConfirmMerge = async (keepA: boolean) => {
    if (!active) return;
    const primary = keepA ? active.a : active.b;
    const secondary = keepA ? active.b : active.a;
    await merge.mutateAsync({
      entity,
      primaryId: primary.id,
      secondaryId: secondary.id,
    });
    setActive(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Motor de Detecção · {entity === 'contacts' ? 'Contatos' : 'Empresas'}
              </CardTitle>
              <CardDescription className="text-xs">
                Fuzzy matching client-side por nome, email, telefone e CNPJ/CPF
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Reanalisar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-2 rounded-md bg-muted/40">
              <p className="text-muted-foreground">Registros analisados</p>
              <p className="text-lg font-semibold">{totalScanned}</p>
            </div>
            <div className="p-2 rounded-md bg-muted/40">
              <p className="text-muted-foreground">Pares suspeitos</p>
              <p className="text-lg font-semibold">{pairs.length}</p>
            </div>
            <div className="p-2 rounded-md bg-muted/40">
              <p className="text-muted-foreground">Limiar</p>
              <p className="text-lg font-semibold">{Math.round(threshold * 100)}%</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Sensibilidade do matching</p>
            <Slider
              value={[threshold * 100]}
              min={70}
              max={100}
              step={1}
              onValueChange={(v) => setThreshold(v[0] / 100)}
            />
          </div>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 h-9"
              placeholder="Filtrar por nome ou email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Pares detectados ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Copy className="h-8 w-8 text-success mx-auto mb-2 opacity-60" />
              <p className="text-sm text-muted-foreground">
                {pairs.length === 0 ? 'Nenhuma duplicata detectada — base limpa! ✨' : 'Nenhum resultado para o filtro.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map((p, i) => (
                <PairRow key={`${p.a.id}-${p.b.id}-${i}`} pair={p} onMerge={setActive} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar mesclagem</DialogTitle>
            <DialogDescription>
              Escolha qual registro será mantido como principal. O outro será removido e suas relações
              serão repointadas. Esta ação é registrada na auditoria e <strong>não pode ser desfeita</strong>.
            </DialogDescription>
          </DialogHeader>
          {active && (
            <div className="grid grid-cols-2 gap-3 my-3">
              {[
                { label: 'Manter A', rec: active.a, keepA: true },
                { label: 'Manter B', rec: active.b, keepA: false },
              ].map(({ label, rec, keepA }) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => handleConfirmMerge(keepA)}
                  disabled={merge.isPending}
                  className="text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium truncate">{rec.name || '—'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{rec.email || '—'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{rec.phone || rec.cnpj || '—'}</p>
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActive(null)} disabled={merge.isPending}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Deduplicacao() {
  return (
    <>
      <Helmet>
        <title>Deduplicação Inteligente · SINGU CRM</title>
        <meta name="description" content="Motor de detecção de duplicatas com fuzzy matching e merge assistido." />
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Deduplicação Inteligente</h1>
          <p className="text-sm text-muted-foreground">
            Detecte e mescle registros duplicados de contatos e empresas com fuzzy matching.
          </p>
        </header>
        <Tabs defaultValue="contacts" className="w-full">
          <TabsList>
            <TabsTrigger value="contacts" className="gap-2"><Users className="h-3.5 w-3.5" />Contatos</TabsTrigger>
            <TabsTrigger value="companies" className="gap-2"><Building2 className="h-3.5 w-3.5" />Empresas</TabsTrigger>
          </TabsList>
          <TabsContent value="contacts" className="mt-4"><DedupTab entity="contacts" /></TabsContent>
          <TabsContent value="companies" className="mt-4"><DedupTab entity="companies" /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}
