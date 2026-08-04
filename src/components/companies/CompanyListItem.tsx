import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Banknote, Network } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Company } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';
import { toTitleCase, formatCapitalSocial } from '@/lib/formatters';

interface CompanyListItemProps {
  company: Company;
  contactCount: number;
  lastInteractionDays: number | null;
  isSelected: boolean;
  selectionMode: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

export const CompanyListItem = React.memo(function CompanyListItem({
  company,
  contactCount,
  lastInteractionDays,
  isSelected,
  selectionMode,
  onSelect,
}: CompanyListItemProps) {
  const location = [company.city, company.state].filter(Boolean).join(', ');
  const capital = formatCapitalSocial(company.capital_social);

  return (
    <Link
      to={`/empresas/${company.id}`}
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-lg border border-border/30 bg-card/40 hover:bg-muted/20 hover:border-border/50 transition-colors group',
        isSelected && 'bg-primary/5 border-primary/30'
      )}
    >
      {selectionMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(c) => onSelect(company.id, c as boolean)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className="relative w-10 h-10 shrink-0">
        <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center text-sm font-semibold text-muted-foreground">
          {company.logo_url ? (
            <OptimizedImage 
              src={company.logo_url} 
              alt={company.name} 
              className="w-10 h-10 rounded-lg object-cover" 
            />
          ) : (
            ((company.name || 'E').replace(/^\d+\s*[-–—]\s*/, '')[0] || 'E').toUpperCase()
          )}
        </div>
        {company.situacao_rf && (
          <span className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
            company.situacao_rf.toUpperCase() === 'ATIVA' ? 'bg-success' : 'bg-destructive'
          )} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {toTitleCase(company.name)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] font-semibold shrink-0',
              company.is_customer
                ? 'border-success/40 text-success bg-success/10'
                : 'border-primary/40 text-primary bg-primary/10'
            )}
          >
            {company.is_customer ? 'Cliente' : 'Prospect'}
          </Badge>
          {company.is_matriz !== null && company.is_matriz !== undefined && (
            <Badge variant="outline" className="text-[9px] font-medium border-accent/40 text-accent-foreground bg-accent/10">
              {company.is_matriz ? 'Matriz' : 'Filial'}
            </Badge>
          )}
          {company.tipo_cooperativa && (
            <Badge variant="outline" className="text-[9px] font-medium border-warning/30 text-warning bg-warning/10">
              {company.tipo_cooperativa}
            </Badge>
          )}
          {company.is_carrier && (
            <Badge variant="outline" className="text-[9px] font-medium border-sky-500/30 text-sky-400 bg-sky-500/10">
              Transp.
            </Badge>
          )}
          {company.is_supplier && (
            <Badge variant="outline" className="text-[9px] font-medium border-orange-500/30 text-orange-400 bg-orange-500/10">
              Fornec.
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
          {(company.ramo_atividade || company.nicho_cliente || company.industry) && (
            <span>{company.ramo_atividade || company.nicho_cliente || company.industry}</span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {contactCount}
          </span>
          {capital && (
            <span className="flex items-center gap-1 tabular-nums">
              <Banknote className="w-3 h-3" />
              {capital}
            </span>
          )}
          {company.grupo_economico && (
            <span className="flex items-center gap-1 max-w-[120px] truncate">
              <Network className="w-3 h-3 shrink-0" />
              {company.grupo_economico}
            </span>
          )}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        {lastInteractionDays !== null && lastInteractionDays !== undefined && (
          <span className={lastInteractionDays > 14 ? 'text-warning' : lastInteractionDays > 30 ? 'text-destructive' : ''}>
            {lastInteractionDays === 0 ? 'Hoje' : `${lastInteractionDays}d`}
          </span>
        )}
        <span className="tabular-nums">
          {formatDistanceToNow(new Date(company.updated_at), { locale: ptBR, addSuffix: true })}
        </span>
      </div>
    </Link>
  );
});
