import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Brain, Search, RefreshCw, X,
  Filter, SortAsc, SortDesc, Crown, Heart,
  ArrowRight, Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioCompatibility } from '@/hooks/usePortfolioCompatibility';
import { PortfolioContactCard } from './portfolio/PortfolioContactCard';
import { PortfolioStatsOverview } from './portfolio/PortfolioStatsOverview';

interface PortfolioCompatibilityReportProps {
  className?: string;
}

export function PortfolioCompatibilityReport({ className }: PortfolioCompatibilityReportProps) {
  const {
    loading, salespersonProfile, filteredContacts, stats,
    expandedContact, setExpandedContact,
    filterLevel, setFilterLevel,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    searchTerm, setSearchTerm, isSearching, clearSearch,
    loadData,
  } = usePortfolioCompatibility();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader><Skeleton className="h-6 w-64" /><Skeleton className="h-4 w-48 mt-1" /></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
        </CardContent>
      </Card>
    );
  }

  if (!salespersonProfile?.discProfile && !salespersonProfile?.vakProfile) {
    return (
      <Card className={className}>
        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" />Relatório de Compatibilidade da Carteira</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground/70 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Configure seu perfil PNL para ver a compatibilidade com seus clientes</p>
            <Button variant="outline" asChild><Link to="/configuracoes">Configurar Meu Perfil<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" />Relatório de Compatibilidade</CardTitle>
            <CardDescription>Análise completa da sua carteira de clientes</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadData()}><RefreshCw className="w-4 h-4 mr-2" />Atualizar</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <PortfolioStatsOverview stats={stats} />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /><span className="font-semibold">Compatibilidade Média da Carteira</span></div>
            <Badge variant="secondary" className="text-lg px-3 py-1">{stats.averageCompatibility}%</Badge>
          </div>
          <Progress value={stats.averageCompatibility} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{stats.total} clientes com perfil PNL configurado</p>
        </motion.div>

        {stats.topOpportunities.length > 0 && (
          <div className="p-4 rounded-lg border border-success dark:border-success bg-success dark:bg-success/20">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-success dark:text-success"><Crown className="w-4 h-4" />Melhores Oportunidades</h4>
            <div className="space-y-2">
              {stats.topOpportunities.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{c.firstName} {c.lastName}</span>
                    {c.discProfile && <Badge variant="outline" className="text-xs">{c.discProfile}</Badge>}
                  </div>
                  <span className="text-sm font-semibold text-success">{c.compatibilityScore}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente... (tolerante a erros)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 ${isSearching ? 'pr-9' : ''}`} />
            {isSearching && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" aria-label="Limpar pesquisa" onClick={clearSearch}><X className="h-4 w-4" /></Button>}
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[150px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Filtrar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="excellent">Excelente</SelectItem>
              <SelectItem value="good">Boa</SelectItem>
              <SelectItem value="moderate">Moderada</SelectItem>
              <SelectItem value="challenging">Desafiadora</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compatibility">Compatibilidade</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="relationship">Score de Relacionamento</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" aria-label="Ordenar" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/70 mb-3" />
              <p className="text-sm text-muted-foreground">{searchTerm || filterLevel !== 'all' ? 'Nenhum cliente encontrado com os filtros aplicados' : 'Nenhum cliente com perfil PNL configurado'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <PortfolioContactCard key={contact.id} contact={contact} expanded={expandedContact === contact.id} onToggle={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)} salespersonProfile={salespersonProfile} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
