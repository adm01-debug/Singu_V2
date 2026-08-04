import { useMemo } from 'react';
import { Building2, Users, CheckCircle2, AlertTriangle, Truck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/hooks/useCompanies';

interface CompaniesStatsBarProps {
  companies: Company[];
  contactCountMap?: Map<string, number>;
  className?: string;
  /** Total real do servidor (ignorando páginas carregadas). Quando fornecido, o card "Total" usa este valor. */
  totalCount?: number;
}

export function CompaniesStatsBar({ companies, contactCountMap, className, totalCount }: CompaniesStatsBarProps) {
  const stats = useMemo(() => {
    const loaded = companies.length;
    const total = totalCount ?? loaded;
    const customers = companies.filter(c => c.is_customer).length;
    const prospects = total - customers;
    const conversionRate = total > 0 ? Math.round((customers / total) * 100) : 0;
    const totalContacts = contactCountMap
      ? Array.from(contactCountMap.values()).reduce((sum, v) => sum + v, 0)
      : 0;
    const needsAttention = companies.filter(c => {
      const daysSince = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 30;
    }).length;
    const carriers = companies.filter(c => c.is_carrier).length;
    const suppliers = companies.filter(c => c.is_supplier).length;

    return { total, customers, prospects, conversionRate, totalContacts, needsAttention, carriers, suppliers };
  }, [companies, contactCountMap, totalCount]);

  return (
    <div className={cn('space-y-3 min-h-[120px]', className)}>
      {/* Main stats row — fixed grid to prevent CLS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 min-h-[52px]">
        <StatCard icon={Building2} label="Total" value={stats.total} color="text-primary" />
        <StatCard icon={CheckCircle2} label="Clientes" value={stats.customers} color="text-success" />
        <StatCard icon={Users} label="Contatos" value={stats.totalContacts} color="text-info" />
        <StatCard icon={AlertTriangle} label="Sem contato +30d" value={stats.needsAttention} color={stats.needsAttention > 0 ? 'text-warning' : 'text-muted-foreground'} />
        <div className="flex items-center gap-2">
          {stats.carriers > 0 && (
            <StatCard icon={Truck} label="Transportadoras" value={stats.carriers} color="text-info" />
          )}
          {stats.suppliers > 0 && (
            <StatCard icon={Package} label="Fornecedores" value={stats.suppliers} color="text-warning" />
          )}
        </div>
      </div>

      {/* Conversion funnel bar */}
      {stats.total > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/40 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground/70">Pipeline de Conversão</span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-success tabular-nums font-medium">
                  {stats.customers.toLocaleString('pt-BR')} clientes
                </span>
                <span className="text-[11px] text-muted-foreground/40">•</span>
                <span className="text-[11px] text-primary/70 tabular-nums">
                  {stats.prospects.toLocaleString('pt-BR')} prospects
                </span>
                <span className="text-[11px] font-semibold text-primary tabular-nums">
                  {stats.conversionRate}%
                </span>
              </div>
            </div>
            <div className="relative h-2.5 rounded-full bg-muted/20 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-success transition-all duration-500"
                style={{ width: `${Math.max(stats.conversionRate, 3)}%`, minWidth: '12px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-lg border border-border/30 px-3 py-2.5',
      'bg-card/40 transition-colors duration-150',
      'hover:bg-muted/20'
    )}>
      <Icon className={cn('w-4 h-4 shrink-0', color)} />
      <div className="min-w-0">
        <p className={cn('text-base font-semibold tabular-nums leading-tight', color)}>
          {value.toLocaleString('pt-BR')}
        </p>
        <p className="text-[10px] text-muted-foreground/70 truncate">{label}</p>
      </div>
    </div>
  );
}
