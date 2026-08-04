import { useMemo } from 'react';
import { ChevronDown, User, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Tables } from '@/integrations/supabase/types';
import type { ContactRole } from '@/types';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;

const roleLabels: Record<ContactRole, string> = {
  owner: 'Proprietário',
  manager: 'Gerente',
  buyer: 'Comprador',
  contact: 'Contato',
  decision_maker: 'Decisor',
  influencer: 'Influenciador',
};

const ALL_ROLES: ContactRole[] = ['owner', 'manager', 'buyer', 'decision_maker', 'influencer', 'contact'];

interface Props {
  contacts: Contact[];
  interactions: Interaction[];
  filteredCount: number;
  totalCount: number;
  selectedContactId: string | null;
  selectedRoles: ContactRole[];
  onSelectContact: (contactId: string | null) => void;
  onToggleRole: (role: ContactRole) => void;
  onClear: () => void;
}

export function InteracoesPessoaCargoBar({
  contacts,
  interactions,
  filteredCount,
  totalCount,
  selectedContactId,
  selectedRoles,
  onSelectContact,
  onToggleRole,
  onClear,
}: Props) {
  const contactById = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

  // Contagem de interações por contato
  const countsByContact = useMemo(() => {
    const counts = new Map<string, number>();
    interactions.forEach((i) => {
      if (i.contact_id) counts.set(i.contact_id, (counts.get(i.contact_id) ?? 0) + 1);
    });
    return counts;
  }, [interactions]);

  // Contatos com pelo menos 1 interação
  const contactsWithInteractions = useMemo(
    () =>
      contacts
        .filter((c) => (countsByContact.get(c.id) ?? 0) > 0)
        .sort((a, b) => (countsByContact.get(b.id) ?? 0) - (countsByContact.get(a.id) ?? 0)),
    [contacts, countsByContact],
  );

  // Papéis presentes entre os contatos com interações
  const availableRoles = useMemo(() => {
    const present = new Set<ContactRole>();
    contactsWithInteractions.forEach((c) => {
      const r = (c.role as ContactRole) || 'contact';
      present.add(r);
    });
    return ALL_ROLES.filter((r) => present.has(r));
  }, [contactsWithInteractions]);

  const selectedContact = selectedContactId ? contactById.get(selectedContactId) ?? null : null;
  const hasFilter = selectedContactId !== null || selectedRoles.length > 0;

  const personLabel = selectedContact
    ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim()
    : 'Todas';
  const rolesLabel =
    selectedRoles.length === 0
      ? 'Todos'
      : selectedRoles.length === 1
        ? roleLabels[selectedRoles[0]]
        : `${selectedRoles.length} papéis`;

  return (
    <div
      role="group"
      aria-label="Filtros por pessoa e cargo"
      className="flex flex-col gap-2 mb-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Pessoa */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" aria-label="Filtrar por pessoa">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pessoa:</span>
              <span className="text-xs font-medium max-w-[160px] truncate">{personLabel}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
            <DropdownMenuLabel className="text-xs">Filtrar por pessoa</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSelectContact(null)} className="text-xs">
              <span className={selectedContactId === null ? 'font-semibold' : ''}>Todas</span>
            </DropdownMenuItem>
            {contactsWithInteractions.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                Nenhum contato com interação
              </div>
            )}
            {contactsWithInteractions.map((c) => {
              const count = countsByContact.get(c.id) ?? 0;
              const role = (c.role as ContactRole) || 'contact';
              const isSelected = selectedContactId === c.id;
              return (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => onSelectContact(c.id)}
                  className="text-xs flex items-center justify-between gap-2"
                >
                  <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>
                    {c.first_name} {c.last_name}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {role !== 'contact' && (
                      <span className="text-[10px] text-muted-foreground">{roleLabels[role]}</span>
                    )}
                    <span className="text-muted-foreground">({count})</span>
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Papel */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              aria-label="Filtrar por papel"
              disabled={availableRoles.length === 0}
            >
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Papel:</span>
              <span className="text-xs font-medium">{rolesLabel}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs">Filtrar por papel</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableRoles.map((r) => (
              <DropdownMenuCheckboxItem
                key={r}
                role="menuitemcheckbox"
                aria-checked={selectedRoles.includes(r)}
                checked={selectedRoles.includes(r)}
                onCheckedChange={() => onToggleRole(r)}
                onSelect={(e) => e.preventDefault()}
                className="text-xs"
              >
                {roleLabels[r]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            <span className="font-medium text-foreground">{filteredCount}</span> de {totalCount}{' '}
            {totalCount === 1 ? 'interação' : 'interações'}
          </span>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onClear}
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {hasFilter && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedContact && (
            <Badge
              variant="secondary"
              size="sm"
              icon={<User className="h-3 w-3" />}
              closeable
              onClose={() => onSelectContact(null)}
            >
              {selectedContact.first_name} {selectedContact.last_name}
            </Badge>
          )}
          {selectedRoles.map((r) => (
            <Badge
              key={r}
              variant="secondary"
              size="sm"
              icon={<Tag className="h-3 w-3" />}
              closeable
              onClose={() => onToggleRole(r)}
            >
              {roleLabels[r]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
