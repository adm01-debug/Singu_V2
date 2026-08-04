import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Package, FileText, Search, RefreshCw, ShieldAlert, DollarSign, Boxes, Inbox } from 'lucide-react';
import { useErpProducts, useErpProposals, useErpStats } from '@/hooks/useErpData';

function formatBRL(value: number | null | undefined) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Package; label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
            {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsTab() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch, isFetching } = useErpProducts(200, search);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />Catálogo de Produtos
            </CardTitle>
            <CardDescription className="text-xs">Visualização somente leitura — gerenciado no ERP</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Buscar por nome, código ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10" />)}</div>
        ) : isError ? (
          <div className="text-center py-8">
            <ShieldAlert className="h-8 w-8 text-warning mx-auto mb-2 opacity-60" />
            <p className="text-sm text-muted-foreground">Catálogo do ERP não disponível no momento.</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
            <p className="text-sm text-muted-foreground">Nenhum produto encontrado no ERP.</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={String(p.id)}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.codigo ?? '—'}</TableCell>
                    <TableCell className="font-medium">{p.nome ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.categoria ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(p.preco)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{p.estoque ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={p.ativo === false ? 'secondary' : 'default'} className="text-[10px]">
                        {p.ativo === false ? 'Inativo' : 'Ativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProposalsTab() {
  const { data, isLoading, isError, refetch, isFetching } = useErpProposals(200);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />Propostas Comerciais
            </CardTitle>
            <CardDescription className="text-xs">Visualização somente leitura — gerenciada no ERP</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10" />)}</div>
        ) : isError ? (
          <div className="text-center py-8">
            <ShieldAlert className="h-8 w-8 text-warning mx-auto mb-2 opacity-60" />
            <p className="text-sm text-muted-foreground">Propostas do ERP indisponíveis.</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
            <p className="text-sm text-muted-foreground">Nenhuma proposta cadastrada no ERP.</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Validade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={String(p.id)}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.numero ?? '—'}</TableCell>
                    <TableCell className="font-medium">{p.cliente_nome ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.vendedor ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{p.status ?? '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(p.valor_total)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {p.data_validade ? new Date(p.data_validade).toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ErpViewer() {
  const { stats, isLoading } = useErpStats();

  return (
    <>
      <Helmet>
        <title>ERP · Produtos & Propostas · SINGU CRM</title>
        <meta name="description" content="Visualização integrada de produtos e propostas do ERP, somente leitura." />
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">ERP · Produtos & Propostas</h1>
          <p className="text-sm text-muted-foreground">
            Dados sincronizados do ERP em tempo real. Cadastros e edições devem ser feitos no sistema de origem.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Boxes} label="Produtos" value={isLoading ? '…' : stats.totalProducts} hint={`${stats.activeProducts} ativos`} />
          <StatCard icon={Package} label="Ativos" value={isLoading ? '…' : stats.activeProducts} />
          <StatCard icon={FileText} label="Propostas" value={isLoading ? '…' : stats.totalProposals} />
          <StatCard icon={DollarSign} label="Valor total" value={isLoading ? '…' : formatBRL(stats.proposalsValueSum)} hint="Soma de propostas" />
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products" className="gap-2"><Package className="h-3.5 w-3.5" />Produtos</TabsTrigger>
            <TabsTrigger value="proposals" className="gap-2"><FileText className="h-3.5 w-3.5" />Propostas</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-4"><ProductsTab /></TabsContent>
          <TabsContent value="proposals" className="mt-4"><ProposalsTab /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}
