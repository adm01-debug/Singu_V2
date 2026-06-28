import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ArrowUpDown, 
  Star, 
  Zap
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import { formatContactName } from '@/lib/formatters';

interface ContactsTableViewProps {
  contacts: Contact[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  getCompanyName: (id: string | null) => string | null;
  getLastInteractionDate: (contactId: string) => string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
}

export const ContactsTableView = React.memo(function ContactsTableView({
  contacts,
  selectionMode,
  selectedIds,
  onSelect,
  getCompanyName,
  getLastInteractionDate,
  sortBy,
  sortOrder,
  onSortChange,
}: ContactsTableViewProps) {
  const { prefetchContactDetails } = useContacts();
// ... keep existing code
  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => onSortChange(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={cn('w-3 h-3', sortBy === field ? 'text-primary' : 'text-muted-foreground/70')} />
    </button>
  );

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden" role="region" aria-label="Tabela de contatos">
      <Table aria-label="Lista de contatos">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/40">
            {selectionMode && <TableHead className="w-10" />}
            <TableHead aria-sort={sortBy === 'first_name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}><SortButton field="first_name">CONTATO</SortButton></TableHead>
            <TableHead className="hidden md:table-cell">ESTÁGIO</TableHead>
            <TableHead className="hidden md:table-cell text-center">SCORE</TableHead>
            <TableHead className="hidden md:table-cell text-center">SNT</TableHead>
            <TableHead className="hidden lg:table-cell">CARGO</TableHead>
            <TableHead className="hidden xl:table-cell">EMPRESA</TableHead>
            <TableHead className="hidden xl:table-cell">ÚLTIMO CONTATO</TableHead>
            <TableHead aria-sort={sortBy === 'updated_at' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}><SortButton field="updated_at">ATUALIZAÇÃO</SortButton></TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const fullName = formatContactName(contact.first_name, contact.last_name);
            const companyName = getCompanyName(contact.company_id);
            return (
              <TableRow
                key={contact.id}
                className={cn(
                  'group cursor-pointer border-border/30 hover:bg-muted/20',
                  selectedIds.has(contact.id) && 'bg-primary/5'
                )}
              >
                {selectionMode && (
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={(c) => onSelect(contact.id, c as boolean)}
                      aria-label={`Selecionar ${fullName}`}
                      className="h-11 w-11 md:h-4 md:w-4" // Touch target min 44px
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <Link 
                      to={`/contatos/${contact.id}`} 
                      className="flex items-center gap-3 min-w-0 flex-shrink-0"
                      onMouseEnter={() => prefetchContactDetails(contact.id)}
                      onFocus={() => prefetchContactDetails(contact.id)}
                    >
                      <OptimizedAvatar
                        src={contact.avatar_url}
                        alt=""
                        aria-hidden="true"
                        fallback={fullName}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {fullName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           {contact.role_title && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1 border-r pr-1.5">{contact.role_title}</span>
                          )}
                          <span className="text-[10px] font-bold text-primary/80 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            Ação sugerida disponível
                          </span>
                        </div>

                      </div>
                    </Link>
                    
                    <div className="hidden sm:flex flex-wrap gap-1 ml-2 max-w-[300px]">
                      {contact.hobbies?.slice(0, 3).map((hobby) => (
                        <Badge key={hobby} variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-50 text-amber-700 border-amber-100/50 font-medium">
                          <Star className="w-2 h-2 mr-0.5" />
                          {hobby}
                        </Badge>
                      ))}
                      {contact.interests?.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-[10px] h-4 px-1.5 bg-purple-50 text-purple-700 border-purple-100/50 font-medium">
                          <Zap className="w-2 h-2 mr-0.5" />
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <RelationshipStageBadge stage={contact.relationship_stage as any || 'unknown'} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {contact.relationship_score != null ? (
                    <RelationshipScore score={contact.relationship_score} size="sm" />
                  ) : (
                    <span className="text-muted-foreground/70">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                   <SentimentIndicator sentiment={contact.sentiment as any || 'neutral'} size="sm" />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm truncate max-w-[150px]">
                  {contact.role_title || '—'}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                  {companyName ? (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" />
                      {companyName}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-muted-foreground tabular-nums">
                  {(() => {
                    const lastInteraction = getLastInteractionDate(contact.id);
                    return lastInteraction 
                      ? formatDistanceToNow(new Date(lastInteraction), { locale: ptBR, addSuffix: true })
                      : 'Nenhum';
                  })()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {formatDistanceToNow(new Date(contact.updated_at), { locale: ptBR, addSuffix: true })}
                </TableCell>

              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});
