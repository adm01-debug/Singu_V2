import { memo, useState } from 'react';
import { Mail, Copy, Check, Plus, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { ExternalEmail } from '@/hooks/useContactRelationalData';
import { EMAIL_TYPE_LABELS } from './helpers';
import { ConfidenceBadge, PrimaryBadge, VerifiedBadge, SourceBadge } from './shared-badges';
import { EnrichmentBadge } from '@/components/enrichment/EnrichmentBadge';
import { useContactValidationStatus } from '@/hooks/useContactValidationStatus';
import { useEmailVerifier } from '@/hooks/useEnrichmentSuite';
import { EmailFinderDialog } from '@/components/enrichment/EmailFinderDialog';
import { ShieldCheck } from 'lucide-react';

const EMAIL_TYPES = ['pessoal', 'profissional', 'corporativo', 'outro'];

function AddEmailDialog({ onAdd }: { onAdd: (data: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: '', email_type: 'profissional', is_primary: false, contexto: '',
  });
  // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = form.email.trim() && emailRegex.test(form.email.trim());

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({
      ...form,
      email: form.email.trim(),
      contexto: form.contexto || undefined,
    });
    setForm({ email: '', email_type: 'profissional', is_primary: false, contexto: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Plus className="h-3 w-3 mr-1" />Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-sm">Novo Email</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="email@exemplo.com *" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
          <Select value={form.email_type} onValueChange={(v) => setForm(p => ({ ...p, email_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EMAIL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{EMAIL_TYPE_LABELS[t] || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox checked={form.is_primary} onCheckedChange={(v) => setForm(p => ({ ...p, is_primary: !!v }))} />
            Email primário
          </label>
          <Input placeholder="Contexto (ex: comunicação interna)" value={form.contexto} onChange={(e) => setForm(p => ({ ...p, contexto: e.target.value }))} />
          <Button size="sm" onClick={handleSubmit} disabled={!isValid}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  emails: ExternalEmail[];
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onAdd?: (data: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  contactId?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactDomain?: string;
}

export const EmailsCard = memo(function EmailsCard({
  emails, copiedField, onCopy, onAdd, onDelete, contactId,
  contactFirstName, contactLastName, contactDomain,
}: Props) {
  const { getEmail, isLoading: validationLoading } = useContactValidationStatus(contactId);
  const verifier = useEmailVerifier();
  const [finderOpen, setFinderOpen] = useState(false);
  const canSearch = !!contactId && !!(contactFirstName || contactLastName);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-info" />
            Emails ({emails.length})
          </span>
          <div className="flex items-center gap-1">
            {canSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setFinderOpen(true)}
                aria-label="Buscar email via EmailFinder"
              >
                <Search className="h-3 w-3 mr-1" />Buscar
              </Button>
            )}
            {onAdd && <AddEmailDialog onAdd={onAdd} />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contactId && (
          <EmailFinderDialog
            open={finderOpen}
            onOpenChange={setFinderOpen}
            contactId={contactId}
            prefillFirstName={contactFirstName}
            prefillLastName={contactLastName}
            prefillDomain={contactDomain}
          />
        )}
        {emails.length > 0 ? emails.map((e) => (
          <div key={e.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <a href={`mailto:${e.email}`} className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[200px]">
                  {e.email}
                </a>
                <PrimaryBadge isPrimary={e.is_primary} />
                <VerifiedBadge isVerified={e.is_verified} />
                {(() => {
                  const v = getEmail(e.email);
                  return <EnrichmentBadge status={v?.status} score={v?.score} loading={validationLoading && !v} compact />;
                })()}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {EMAIL_TYPE_LABELS[e.email_type] || e.email_type}
                </Badge>
                <ConfidenceBadge value={e.confiabilidade} />
                <SourceBadge fonte={e.fonte} />
              </div>
              {e.email_normalizado && e.email_normalizado !== e.email && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Normalizado: {e.email_normalizado}</p>
              )}
              {e.contexto && <p className="text-[10px] text-muted-foreground mt-0.5">{e.contexto}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => verifier.mutate({ email: e.email, contactId })}
                disabled={verifier.isPending}
                aria-label={`Verificar ${e.email}`}
                className="rounded p-1 text-muted-foreground hover:bg-info/10 hover:text-info transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="h-3 w-3" />
              </button>
              <button
                aria-label={`Copiar email ${e.email}`}
                onClick={() => onCopy(e.email, `email-${e.id}`)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {copiedField === `email-${e.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(e.id)}
                  aria-label={`Remover email ${e.email}`}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum email registrado</p>
        )}
      </CardContent>
    </Card>
  );
});
