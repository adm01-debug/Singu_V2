import { useState } from 'react';
import { useNpsSurveys } from '@/hooks/useNpsSurveys';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useContacts } from '@/hooks/useContacts';
import { Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function SendSurveyDialog({ open, onOpenChange }: Props) {
  const { contacts } = useContacts(undefined, { fetchAll: true });
  const { createSurvey, isCreating } = useNpsSurveys();
  const [contactId, setContactId] = useState('');
  const [channel, setChannel] = useState('email');
  const [search, setSearch] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = (contacts ?? []).filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 50);

  const publicUrl = createdToken
    ? `${window.location.origin}/survey/${createdToken}`
    : '';

  const handleSend = async () => {
    if (!contactId) return;
    const result = await createSurvey({ contact_id: contactId, channel });
    if (result?.public_token) {
      setCreatedToken(result.public_token);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setContactId('');
    setSearch('');
    setCreatedToken(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else onOpenChange(o); }}>
      <DialogContent>
        {createdToken ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Pesquisa criada!
              </DialogTitle>
              <DialogDescription>
                Compartilhe este link com o contato. Ele poderá responder sem precisar fazer login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Link público (válido por 30 dias)
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input value={publicUrl} readOnly className="h-8 text-xs font-mono" />
                  <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" asChild className="shrink-0">
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Dica: cole este link no email, WhatsApp ou SMS que enviar ao cliente.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nova Pesquisa NPS/CSAT</DialogTitle>
              <DialogDescription>Envie uma pesquisa de satisfação para um contato.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Buscar contato</Label>
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Digite o nome…" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Contato</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {filtered.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.email ? ` — ${c.email}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Canal</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="in_app">In-app</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleSend} disabled={!contactId || isCreating}>Gerar link</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
