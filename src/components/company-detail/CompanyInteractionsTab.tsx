import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { motion } from 'framer-motion';
import { MessageSquare, Phone, Mail, Globe, Users, Edit, Plus, Clock, FilterX } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InteracoesPessoaCargoBar } from './InteracoesPessoaCargoBar';
import type { Tables } from '@/integrations/supabase/types';
import type { SentimentType, ContactRole } from '@/types';

type Interaction = Tables<'interactions'>;
type Contact = Tables<'contacts'>;

const interactionIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: Globe,
};

const interactionColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-accent text-accent-foreground',
};

const VALID_ROLES: ReadonlySet<ContactRole> = new Set([
  'owner',
  'manager',
  'buyer',
  'contact',
  'decision_maker',
  'influencer',
]);

interface CompanyInteractionsTabProps {
  interactions: Interaction[];
  contacts?: Contact[];
}

export function CompanyInteractionsTab({ interactions, contacts = [] }: CompanyInteractionsTabProps) {
  const [params, setParams] = useSearchParams();

  const selectedContactId = params.get('pessoa');
  const selectedRoles = useMemo<ContactRole[]>(() => {
    const raw = params.get('papeis');
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is ContactRole => VALID_ROLES.has(s as ContactRole));
  }, [params]);

  const updateParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          mutate(p);
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setSelectedContact = useCallback(
    (id: string | null) => {
      updateParams((p) => {
        if (id) p.set('pessoa', id);
        else p.delete('pessoa');
      });
    },
    [updateParams],
  );

  const toggleRole = useCallback(
    (role: ContactRole) => {
      updateParams((p) => {
        const current = (p.get('papeis') ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter((s): s is ContactRole => VALID_ROLES.has(s as ContactRole));
        const next = current.includes(role)
          ? current.filter((r) => r !== role)
          : [...current, role];
        if (next.length === 0) p.delete('papeis');
        else p.set('papeis', next.join(','));
      });
    },
    [updateParams],
  );

  const clearFilters = useCallback(() => {
    updateParams((p) => {
      p.delete('pessoa');
      p.delete('papeis');
    });
  }, [updateParams]);

  const contactById = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

  const filtered = useMemo(() => {
    if (!selectedContactId && selectedRoles.length === 0) return interactions;
    return interactions.filter((i) => {
      if (selectedContactId && i.contact_id !== selectedContactId) return false;
      if (selectedRoles.length > 0) {
        const c = i.contact_id ? contactById.get(i.contact_id) : null;
        const role = (c?.role as ContactRole) || 'contact';
        if (!selectedRoles.includes(role)) return false;
      }
      return true;
    });
  }, [interactions, selectedContactId, selectedRoles, contactById]);

  const hasFilters = selectedContactId !== null || selectedRoles.length > 0;
  const showFiltersBar = contacts.length > 0 && interactions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showFiltersBar && (
        <InteracoesPessoaCargoBar
          contacts={contacts}
          interactions={interactions}
          filteredCount={filtered.length}
          totalCount={interactions.length}
          selectedContactId={selectedContactId}
          selectedRoles={selectedRoles}
          onSelectContact={setSelectedContact}
          onToggleRole={toggleRole}
          onClear={clearFilters}
        />
      )}

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((interaction, index) => {
            const Icon = interactionIcons[interaction.type] || MessageSquare;
            const colorClass = interactionColors[interaction.type] || interactionColors.note;
            const contact = interaction.contact_id ? contactById.get(interaction.contact_id) : null;

            return (
              <motion.div
                key={interaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{interaction.title}</h4>
                          <SentimentIndicator
                            sentiment={(interaction.sentiment as SentimentType) || 'neutral'}
                            size="sm"
                          />
                          {contact && (
                            <span className="text-xs text-muted-foreground">
                              · {contact.first_name} {contact.last_name}
                            </span>
                          )}
                          {interaction.follow_up_required && (
                            <Badge variant="outline" className="text-warning border-warning">
                              <Clock className="w-3 h-3 mr-1" />
                              Follow-up
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {interaction.content}
                        </p>
                        {interaction.key_insights && interaction.key_insights.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {interaction.key_insights.map((insight, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{insight}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{format(new Date(interaction.created_at), "d MMM", { locale: ptBR })}</p>
                        <p>{format(new Date(interaction.created_at), "HH:mm")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : hasFilters ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FilterX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma interação para esses filtros</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros de pessoa ou papel para ver mais resultados.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <FilterX className="w-4 h-4 mr-2" />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma interação registrada</h3>
            <p className="text-muted-foreground mb-4">
              Registre suas interações para manter o histórico de relacionamento.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Interação
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
