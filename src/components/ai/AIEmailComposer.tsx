import { useEffect, useMemo, useState } from 'react';
import { Mail, Sparkles, Copy, Wand2, Check, ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContacts } from '@/hooks/useContacts';
import { useAIWritingAssistant } from '@/hooks/useAIWritingAssistant';
import { useEmailRefine } from '@/hooks/useEmailRefine';
import { useEmailComposerStore } from '@/store/emailComposerStore';
import { cn } from '@/lib/utils';

type MessageType = 'follow_up' | 'introduction' | 'proposal' | 'check_in' | 'thank_you' | 'meeting_request' | 'custom';
type Tone = 'formal' | 'casual' | 'friendly';

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'introduction', label: 'Introdução' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'thank_you', label: 'Agradecimento' },
  { value: 'meeting_request', label: 'Pedido de reunião' },
  { value: 'custom', label: 'Personalizado' },
];

const TONES: { value: Tone; label: string }[] = [
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Amigável' },
  { value: 'casual', label: 'Casual' },
];

const REFINE_CHIPS = [
  'Mais curto',
  'Mais formal',
  'Mais persuasivo',
  'Adicionar urgência',
  'Mais amigável',
  'Corrigir gramática',
];

interface SuggestionState {
  id: string;
  subject?: string;
  message: string;
  callToAction?: string;
  reasoning?: string;
  refining?: boolean;
  reasoningOpen?: boolean;
  copied?: boolean;
}

export function AIEmailComposer() {
  const { isOpen, prefilledContactId, close } = useEmailComposerStore();
  const { contacts = [], loading: loadingContacts } = useContacts();
  const { suggestions, loading: generating, error, generateSuggestions, clearSuggestions } = useAIWritingAssistant();
  const refineMutation = useEmailRefine();

  const [contactId, setContactId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>('follow_up');
  const [tone, setTone] = useState<Tone>('friendly');
  const [customContext, setCustomContext] = useState('');
  const [items, setItems] = useState<SuggestionState[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [contactPickerOpen, setContactPickerOpen] = useState(false);

  // Sync prefill
  useEffect(() => {
    if (isOpen) setContactId(prefilledContactId);
    if (!isOpen) {
      setItems([]);
      setCustomContext('');
      clearSuggestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prefilledContactId]);

  // Sync incoming suggestions
  useEffect(() => {
    if (suggestions.length > 0) {
      setItems(
        suggestions.map((s, idx) => ({
          id: `${Date.now()}-${idx}`,
          subject: s.subject,
          message: s.message,
          callToAction: s.callToAction,
          reasoning: s.reasoning,
        })),
      );
    }
  }, [suggestions]);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === contactId) ?? null,
    [contacts, contactId],
  );

  const filteredContacts = useMemo(() => {
    const term = contactSearch.toLowerCase().trim();
    if (!term) return contacts.slice(0, 50);
    return contacts
      .filter((c) => `${c.first_name} ${c.last_name} ${c.email ?? ''}`.toLowerCase().includes(term))
      .slice(0, 50);
  }, [contacts, contactSearch]);

  const handleGenerate = async () => {
    if (!selectedContact) {
      toast.error('Selecione um contato');
      return;
    }
    await generateSuggestions({
      contact: {
        firstName: selectedContact.first_name,
        lastName: selectedContact.last_name,
        roleTitle: selectedContact.role_title ?? undefined,
        hobbies: selectedContact.hobbies ?? undefined,
        interests: selectedContact.interests ?? undefined,
      },
      messageType,
      tone,
      customContext: customContext.trim() || undefined,
    });
  };

  const handleCopy = async (item: SuggestionState) => {
    const ctaSuffix = item.callToAction ? `\n\n${item.callToAction}` : '';
    const text = item.subject
      ? `Assunto: ${item.subject}\n\n${item.message}${ctaSuffix}`
      : `${item.message}${ctaSuffix}`;
    try {
      await navigator.clipboard.writeText(text);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, copied: true } : i)));
      toast.success('Email copiado para a área de transferência');
      setTimeout(() => {
        // eslint-disable-next-line sonarjs/no-nested-functions
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, copied: false } : i)));
      }, 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleRefine = async (item: SuggestionState, instruction: string) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, refining: true } : i)));
    try {
      const result = await refineMutation.mutateAsync({
        original: item.message,
        subject: item.subject,
        instruction,
        tone,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, message: result.message, subject: result.subject ?? i.subject, refining: false }
            : i,
        ),
      );
      toast.success(`Refinado: ${instruction.toLowerCase()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao refinar';
      toast.error(msg);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, refining: false } : i)));
    }
  };

  const toggleReasoning = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, reasoningOpen: !i.reasoningOpen } : i)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Compor email com IA
          </DialogTitle>
          <DialogDescription>
            Gera sugestões personalizadas com base no perfil do contato e refina com um clique.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Contato */}
          <div className="space-y-1.5">
            <Label className="text-xs">Contato</Label>
            <Popover open={contactPickerOpen} onOpenChange={setContactPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  {selectedContact
                    ? `${selectedContact.first_name} ${selectedContact.last_name}`
                    : loadingContacts
                    ? 'Carregando…'
                    : 'Selecione um contato'}
                  <Search className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="p-2 border-b border-border">
                  <Input
                    autoFocus
                    placeholder="Buscar por nome ou email…"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <ScrollArea className="max-h-64">
                  {filteredContacts.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">Nenhum contato encontrado</div>
                  )}
                  {filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setContactId(c.id);
                        setContactPickerOpen(false);
                        setContactSearch('');
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center justify-between',
                        contactId === c.id && 'bg-primary/10',
                      )}
                    >
                      <span className="truncate">{c.first_name} {c.last_name}</span>
                      {c.email && <span className="text-xs text-muted-foreground truncate ml-2">{c.email}</span>}
                    </button>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de mensagem</Label>
            <div className="flex flex-wrap gap-1.5">
              {MESSAGE_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  size="sm"
                  variant={messageType === t.value ? 'default' : 'outline'}
                  onClick={() => setMessageType(t.value)}
                  className="h-7 text-xs"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tom */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tom</Label>
            <div className="flex gap-1.5">
              {TONES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  size="sm"
                  variant={tone === t.value ? 'default' : 'outline'}
                  onClick={() => setTone(t.value)}
                  className="h-7 text-xs"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Contexto */}
          <div className="space-y-1.5">
            <Label className="text-xs">Contexto adicional (opcional)</Label>
            <Textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Ex.: Falamos sobre integração com ERP semana passada e pediram revisão da proposta."
              rows={3}
              maxLength={2000}
            />
          </div>

          <Button onClick={handleGenerate} disabled={generating || !selectedContact} className="w-full gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Gerando sugestões…' : 'Gerar com IA'}
          </Button>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Sugestões */}
          {items.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {items.length} sugestão{items.length > 1 ? 'ões' : ''}
              </div>
              {items.map((item, idx) => (
                <div key={item.id} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">Opção {idx + 1}</Badge>
                    {item.refining && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                  </div>
                  {item.subject && (
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">Assunto: </span>
                      <span className="font-medium">{item.subject}</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{item.message}</div>
                  {item.callToAction && (
                    <div className="text-xs text-primary font-medium border-t border-border pt-2">
                      → {item.callToAction}
                    </div>
                  )}
                  {item.reasoning && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleReasoning(item.id)}
                        className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        {item.reasoningOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Por que essa abordagem
                      </button>
                      {item.reasoningOpen && (
                        <div className="mt-1.5 text-[11px] text-muted-foreground bg-muted/40 rounded p-2 leading-relaxed">
                          {item.reasoning}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button size="sm" variant="default" onClick={() => handleCopy(item)} className="h-7 text-xs gap-1.5">
                      {item.copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {item.copied ? 'Copiado' : 'Copiar'}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline" disabled={item.refining} className="h-7 text-xs gap-1.5">
                          <Wand2 className="w-3 h-3" />
                          Refinar
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="start">
                        <div className="text-[11px] text-muted-foreground mb-1.5 px-1">Aplicar instrução:</div>
                        <div className="flex flex-wrap gap-1">
                          {REFINE_CHIPS.map((chip) => (
                            <Button
                              key={chip}
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[11px] px-2"
                              onClick={() => handleRefine(item, chip)}
                            >
                              {chip}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Mail className="w-3 h-3" /> Powered by IA · Lovable AI Gateway
          </span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono">⌘ + Shift + E</kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}
