import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryExternalData } from '@/lib/externalData';
import { parseApiError } from '@/lib/errorMessages';
import type { Sequence } from '@/hooks/useSequences';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContactOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Props {
  sequence: Sequence;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnroll: (contactId: string) => Promise<unknown>;
  loading: boolean;
}

export function SequenceEnrollDialog({ sequence, open, onOpenChange, onEnroll, loading }: Props) {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [contactId, setContactId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const { data: contacts = [], isFetching, error } = useQuery({
    queryKey: ['sequence-enroll-contacts', user?.id, search],
    enabled: open && !!user,
    retry: false,
    queryFn: async () => {
      const { data, error: queryError } = await queryExternalData<ContactOption>({
        table: 'contacts',
        select: 'id, first_name, last_name, email',
        filters: [
          { type: 'eq', column: 'user_id', value: user!.id },
          { type: 'is', column: 'deleted_at', value: null },
        ],
        search: { term: search, columns: ['first_name', 'last_name', 'email'] },
        order: { column: 'first_name', ascending: true },
        range: { from: 0, to: 19 },
        countMethod: null,
      });
      if (queryError) throw queryError;
      return data ?? [];
    },
  });

  const handleEnroll = async () => {
    if (!contactId || loading) return;
    setSubmitError('');
    try {
      await onEnroll(contactId);
      onOpenChange(false);
    } catch (cause) {
      setSubmitError(parseApiError(cause));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscrever contato em {sequence.name}</DialogTitle>
          <DialogDescription>Selecione um contato da sua carteira. Uma inscrição repetida não cria outra etapa.</DialogDescription>
        </DialogHeader>

        <form onSubmit={event => {
          event.preventDefault();
          setContactId('');
          setSearch(draft.trim());
        }} className="space-y-2">
          <Label htmlFor="sequence-contact-search">Buscar contato por nome ou email</Label>
          <div className="flex gap-2">
            <Input id="sequence-contact-search" value={draft} onChange={event => setDraft(event.target.value)} />
            <Button type="submit" variant="outline" disabled={isFetching}>Buscar</Button>
          </div>
        </form>

        <div role="group" aria-label="Contatos encontrados" className="max-h-52 space-y-1 overflow-y-auto">
          {isFetching ? <p className="text-sm text-muted-foreground">Buscando contatos…</p>
            : error ? <p role="alert" className="text-sm text-destructive">Não foi possível consultar os contatos. Tente novamente.</p>
            : contacts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum contato encontrado.</p>
            : contacts.map(contact => (
              <Button
                key={contact.id}
                type="button"
                variant={contactId === contact.id ? 'secondary' : 'ghost'}
                className="h-auto w-full justify-start whitespace-normal text-left"
                aria-pressed={contactId === contact.id}
                onClick={() => setContactId(contact.id)}
              >
                {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Sem nome'}
                {contact.email ? ` — ${contact.email}` : ''}
              </Button>
            ))}
          {!error && contacts.length === 20 && <p className="text-xs text-muted-foreground">Exibindo 20 contatos. Use a busca para encontrar outros.</p>}
        </div>

        {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={() => void handleEnroll()} disabled={!contactId || loading || isFetching || !!error}>
            {loading ? 'Inscrevendo…' : 'Inscrever contato'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
