import React from 'react';
import { Factory, Briefcase, ShoppingCart, Landmark, Cpu, HeartPulse, GraduationCap,
  Globe, Banknote, Network, Truck, Package,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCapitalSocial, formatCnpj } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Company } from '@/hooks/useCompanies';

// eslint-disable-next-line react-refresh/only-export-components
export const industryIcons: Record<string, React.ElementType> = {
  'Tecnologia': Cpu, 'Saúde': HeartPulse, 'Educação': GraduationCap,
  'Varejo': ShoppingCart, 'Financeiro': Landmark, 'Indústria': Factory, 'Serviços': Briefcase,
};

// eslint-disable-next-line react-refresh/only-export-components
export function getAvatarInitial(name: string): string {
  const cleaned = name.replace(/^\d+\s*[-–—]\s*/, '');
  return (cleaned || name || 'E')[0].toUpperCase();
}

// eslint-disable-next-line react-refresh/only-export-components
export function hashStringToHue(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) { hash ^= str.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return Math.abs(hash) % 360;
}

// eslint-disable-next-line react-refresh/only-export-components
export function getAvatarStyle(name: string): React.CSSProperties {
  const hue = hashStringToHue(name);
  return { background: `linear-gradient(135deg, hsl(${hue}, 55%, 45%), hsl(${(hue + 40) % 360}, 50%, 35%))` };
}

export function RfStatusDot({ situacao }: { situacao: string | null }) {
  if (!situacao) return null;
  const isActive = situacao.toUpperCase() === 'ATIVA';
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild><span className={cn('w-2 h-2 rounded-full shrink-0', isActive ? 'bg-success' : 'bg-destructive')} /></TooltipTrigger>
        <TooltipContent side="top" className="text-xs">RF: {situacao}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function StatusDot({ status, isCustomer }: { status: string | null; isCustomer: boolean | null }) {
  if (isCustomer) return (<div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" /><span className="text-xs text-success font-medium">Ativo</span></div>);
  const normalized = (status || '').toLowerCase();
  if (normalized === 'inactive' || normalized === 'inativo') return (<div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /><span className="text-xs text-destructive font-medium">Inativo</span></div>);
  return (<div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-info" /><span className="text-xs text-info font-medium">Ativo</span></div>);
}

export function TimeAgo({ date }: { date: string }) {
  const daysSince = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  const color = daysSince <= 7 ? 'text-muted-foreground' : daysSince <= 14 ? 'text-warning' : 'text-destructive';
  return <span className={cn('text-[11px] tabular-nums', color)}>{formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true })}</span>;
}

export function LeadScoreBadge({ score, status }: { score: number | null | undefined; status: string | null | undefined }) {
  if (!score && !status) return null;
  const numScore = typeof score === 'number' ? score : null;
  const color = numScore !== null
    ? numScore >= 80 ? 'text-success bg-success/10 border-success/20' : numScore >= 50 ? 'text-warning bg-warning/10 border-warning/20' : 'text-muted-foreground bg-muted/10 border-border/20'
    : 'text-muted-foreground bg-muted/10 border-border/20';
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium rounded-md px-1.5 py-0.5 border', color)}>
            {numScore !== null ? `${numScore}` : '–'}{status && <span className="opacity-70">·{status}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Lead Score{numScore !== null ? `: ${numScore}/100` : ''}{status ? ` — ${status}` : ''}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function IntelligenceStrip({ company }: { company: Company }) {
  const capital = formatCapitalSocial(company.capital_social);
  const leadScore = (company as Record<string, unknown>).lead_score as number | null;
  const leadStatus = (company as Record<string, unknown>).lead_status as string | null;
  const hasData = capital || company.grupo_economico || company.nicho_cliente || company.website || company.situacao_rf || company.is_carrier || company.is_supplier || leadScore || leadStatus;
  if (!hasData) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-border/10">
      {company.situacao_rf && <RfStatusDot situacao={company.situacao_rf} />}
      {(leadScore || leadStatus) && <LeadScoreBadge score={leadScore} status={leadStatus} />}
      {capital && (<span className="inline-flex items-center gap-1 text-[10px] text-success/80 bg-success/8 border border-success/15 rounded-md px-1.5 py-0.5"><Banknote className="w-3 h-3" />{capital}</span>)}
      {company.grupo_economico && (<span className="inline-flex items-center gap-1 text-[10px] text-info/80 bg-info/8 border border-info/15 rounded-md px-1.5 py-0.5 max-w-[130px] truncate"><Network className="w-3 h-3 shrink-0" />{company.grupo_economico}</span>)}
      {company.nicho_cliente && !company.industry && (<span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 bg-muted/20 border border-border/20 rounded-md px-1.5 py-0.5 max-w-[110px] truncate">{company.nicho_cliente}</span>)}
      {company.is_carrier && (<span className="inline-flex items-center gap-1 text-[10px] text-info bg-info/10 border border-info/20 rounded-md px-1.5 py-0.5"><Truck className="w-3 h-3" />Transp.</span>)}
      {company.is_supplier && (<span className="inline-flex items-center gap-1 text-[10px] text-warning bg-warning/10 border border-warning/20 rounded-md px-1.5 py-0.5"><Package className="w-3 h-3" />Fornec.</span>)}
      {company.website && (
        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground/40 hover:text-primary transition-colors">
          <Globe className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

export function ScorecardTooltip({ company, children }: { company: Company; children: React.ReactNode }) {
  const cnpjFormatted = formatCnpj(company.cnpj);
  const capital = formatCapitalSocial(company.capital_social);
  const leadScore = (company as Record<string, unknown>).lead_score as number | null;
  const leadStatus = (company as Record<string, unknown>).lead_status as string | null;
  const hasExtra = cnpjFormatted || company.razao_social || capital || company.situacao_rf || company.porte_rf || leadScore || leadStatus;
  if (!hasExtra) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-[280px] p-3 space-y-1.5">
          {company.razao_social && <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Razão Social:</span> {company.razao_social}</p>}
          {cnpjFormatted && <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">CNPJ:</span> {cnpjFormatted}</p>}
          {capital && <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Capital Social:</span> {capital}</p>}
          {company.situacao_rf && <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Situação RF:</span> <span className={company.situacao_rf.toUpperCase() === 'ATIVA' ? 'text-success' : 'text-destructive'}>{company.situacao_rf}</span></p>}
          {company.porte_rf && <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Porte:</span> {company.porte_rf}</p>}
          {company.grupo_economico && <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Grupo:</span> {company.grupo_economico}</p>}
          {(leadScore || leadStatus) && <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Lead Score:</span> <span className={leadScore && leadScore >= 80 ? 'text-success' : leadScore && leadScore >= 50 ? 'text-warning' : ''}>{leadScore ? `${leadScore}/100` : '–'}{leadStatus ? ` (${leadStatus})` : ''}</span></p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
