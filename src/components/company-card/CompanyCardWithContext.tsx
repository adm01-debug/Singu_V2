import { memo, useState, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, MoreVertical, MessageSquare } from 'lucide-react';
import { CompanyInteractionsModal } from './CompanyInteractionsModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { QuickActionsMenu } from '@/components/context-menu/QuickActionsMenu';
import { InlineEdit } from '@/components/inline-edit/InlineEdit';
import { usePrefetch, usePrefetchOnHover } from '@/hooks/usePrefetch';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Company } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/formatters';
import {
  industryIcons, getAvatarInitial, getAvatarStyle,
  StatusDot, TimeAgo, IntelligenceStrip, ScorecardTooltip,
} from './company-card-parts/CompanyCardHelpers';

interface CompanyCardWithContextProps {
  company: Company;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
  contactCount?: number;
  lastInteractionDays?: number | null;
  compact?: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onUpdate: (id: string, data: Partial<Company>) => Promise<Company | null>;
}

function CompanyCardWithContextImpl({
  company, index, isSelected, isHighlighted, selectionMode,
  contactCount = 0, compact = false,
  onSelect, onEdit, onDelete, onUpdate,
}: CompanyCardWithContextProps) {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [interactionsOpen, setInteractionsOpen] = useState(false);
  const navigate = useNavigate();
  const { prefetchCompany } = usePrefetch();
  const prefetchFn = useCallback(() => { prefetchCompany(company.id); }, [company.id, prefetchCompany]);
  const hoverProps = usePrefetchOnHover(prefetchFn, 150);

  const handleInlineSave = async (field: string, value: string): Promise<boolean> => {
    try { if (field === 'name') { await onUpdate(company.id, { name: value }); } return true; } catch { return false; }
  };

  const interactionsHref = `/interacoes?company=${encodeURIComponent(company.id)}`;
  const detailHref = `/empresas/${company.id}`;

  const handleCardActivate = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    // Permite Ctrl/⌘/middle-click abrir em nova aba via comportamento nativo do <a>
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    // Ignora cliques originados em elementos interativos internos (botões, links, inputs)
    const target = e.target as HTMLElement;
    if (target.closest('a, button, [role="menuitem"], input, [data-no-card-nav]')) return;
    e.preventDefault();
    navigate(detailHref);
  }, [navigate, detailHref]);

  // Clique no nome / botão "Ver interações":
  // - Ctrl/⌘/middle-click → deixa o navegador abrir em nova aba (target="_blank")
  // - Clique normal → abre o modal e cancela a navegação
  const handleInteractionsClick = useCallback((e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      // Permite o comportamento padrão do <a target="_blank"> (nova aba)
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setInteractionsOpen(true);
  }, []);

  const displayName = toTitleCase(company.name);
  const subtitle = company.ramo_atividade || company.nicho_cliente || company.industry
    ? (company.ramo_atividade || company.nicho_cliente || company.industry)
    : (company.city || company.state) ? [company.city, company.state].filter(Boolean).join(', ') : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }} {...hoverProps}>
      <QuickActionsMenu entityType="company" entityId={company.id} entityName={company.name} email={company.email} phone={company.phone} onEdit={() => onEdit(company)} onDelete={() => onDelete(company)}>
        <ScorecardTooltip company={company}>
          <Card className={cn("h-full group cursor-pointer overflow-hidden transition-colors duration-150", "border border-border/30 hover:border-border/50", isHighlighted && "ring-1 ring-primary/50", isSelected && "bg-primary/5 border-primary/30")}>
            {selectionMode && (
              <div className="absolute top-3 left-3 z-20">
                <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(company.id, checked as boolean)} onClick={(e) => e.stopPropagation()} />
              </div>
            )}
            <div className="absolute top-3 right-3 z-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(company)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(company)} className="text-destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              role="link"
              tabIndex={0}
              aria-label={`Abrir detalhes de ${displayName}`}
              onClick={handleCardActivate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  const target = e.target as HTMLElement;
                  if (target.closest('a, button, input, [data-no-card-nav]')) return;
                  e.preventDefault();
                  navigate(detailHref);
                }
              }}
              className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <CardContent className={cn("p-4", compact && "p-3")}>
                {compact ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={displayName} className="w-9 h-9 rounded-lg object-cover shrink-0" loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0" style={getAvatarStyle(company.name)}>
                            {getAvatarInitial(company.name)}
                          </div>
                        )}
                        <a
                          href={interactionsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleInteractionsClick}
                          className="font-semibold text-sm leading-tight text-foreground truncate max-w-[120px] hover:text-primary hover:underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                          title={`Ver interações de ${displayName} (Ctrl/⌘+clique abre nova aba)`}
                        >
                          {displayName}
                        </a>
                      </div>
                      <Badge variant="outline" className={cn('text-[9px] font-semibold shrink-0', company.is_customer ? 'border-success/40 text-success bg-success/10' : 'border-primary/40 text-primary bg-primary/10')}>
                        {company.is_customer ? 'Cliente' : 'Prospect'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{contactCount} {contactCount === 1 ? 'contato' : 'contatos'}</span>
                      <a
                        href={interactionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleInteractionsClick}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 -mx-1"
                        aria-label={`Ver interações de ${displayName}`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Ver interações
                      </a>
                    </div>
                    <IntelligenceStrip company={company} />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                      <StatusDot status={company.status} isCustomer={company.is_customer} />
                      <TimeAgo date={company.updated_at} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={displayName} className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-base shrink-0" style={getAvatarStyle(company.name)}>
                          {getAvatarInitial(company.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isInlineEditing ? (
                            <InlineEdit value={company.name} onSave={(value: string) => handleInlineSave('name', value)} className="font-semibold text-sm" />
                          ) : (
                            <a
                              href={interactionsHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={handleInteractionsClick}
                              onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsInlineEditing(true); }}
                              className="font-semibold text-sm leading-tight text-foreground truncate hover:text-primary hover:underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                              title={`Ver interações de ${displayName} (Ctrl/⌘+clique abre nova aba, duplo-clique edita)`}
                            >
                              {displayName}
                            </a>
                          )}
                          <Badge variant="outline" className={cn('text-[9px] font-semibold shrink-0', company.is_customer ? 'border-success/40 text-success bg-success/10' : 'border-primary/40 text-primary bg-primary/10')}>
                            {company.is_customer ? 'Cliente' : 'Prospect'}
                          </Badge>
                        </div>
                        {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{contactCount} {contactCount === 1 ? 'contato' : 'contatos'}</span>
                      <a
                        href={interactionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleInteractionsClick}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 -mx-1"
                        aria-label={`Ver interações de ${displayName}`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Ver interações
                      </a>
                    </div>
                    <IntelligenceStrip company={company} />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                      <StatusDot status={company.status} isCustomer={company.is_customer} />
                      <TimeAgo date={company.updated_at} />
                    </div>
                  </>
                )}
              </CardContent>
            </div>
          </Card>
        </ScorecardTooltip>
      </QuickActionsMenu>

      <CompanyInteractionsModal
        open={interactionsOpen}
        onOpenChange={setInteractionsOpen}
        companyId={company.id}
        companyName={displayName}
      />
    </motion.div>
  );
}

export const CompanyCardWithContext = memo(CompanyCardWithContextImpl);
