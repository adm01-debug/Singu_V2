import { memo, useState } from 'react';
import { Phone, MessageSquare, Copy, Check, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { ExternalPhone } from '@/hooks/useContactRelationalData';
import { PHONE_TYPE_LABELS, formatPhoneDisplay } from './helpers';
import { ConfidenceBadge, PrimaryBadge, VerifiedBadge, SourceBadge } from './shared-badges';
import { EnrichmentBadge } from '@/components/enrichment/EnrichmentBadge';
import { useContactValidationStatus } from '@/hooks/useContactValidationStatus';
import { usePhoneValidator } from '@/hooks/useEnrichmentSuite';
import { ShieldCheck } from 'lucide-react';

const PHONE_TYPES = ['celular', 'fixo', 'comercial', 'whatsapp', 'recado', 'outro'];

function AddPhoneDialog({ onAdd }: { onAdd: (data: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    numero: '', phone_type: 'celular', is_primary: false, is_whatsapp: false,
    contexto: '', observacao: '',
  });

  const handleSubmit = () => {
    if (!form.numero.trim()) return;
    onAdd({
      ...form,
      numero: form.numero.trim(),
      contexto: form.contexto || undefined,
      observacao: form.observacao || undefined,
    });
    setForm({ numero: '', phone_type: 'celular', is_primary: false, is_whatsapp: false, contexto: '', observacao: '' });
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
        <DialogHeader><DialogTitle className="text-sm">Novo Telefone</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Número *" value={form.numero} onChange={(e) => setForm(p => ({ ...p, numero: e.target.value }))} />
          <Select value={form.phone_type} onValueChange={(v) => setForm(p => ({ ...p, phone_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PHONE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{PHONE_TYPE_LABELS[t] || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={form.is_primary} onCheckedChange={(v) => setForm(p => ({ ...p, is_primary: !!v }))} />
              Primário
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={form.is_whatsapp} onCheckedChange={(v) => setForm(p => ({ ...p, is_whatsapp: !!v }))} />
              WhatsApp
            </label>
          </div>
          <Input placeholder="Contexto (ex: pessoal, trabalho)" value={form.contexto} onChange={(e) => setForm(p => ({ ...p, contexto: e.target.value }))} />
          <Input placeholder="Observação" value={form.observacao} onChange={(e) => setForm(p => ({ ...p, observacao: e.target.value }))} />
          <Button size="sm" onClick={handleSubmit} disabled={!form.numero.trim()}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  phones: ExternalPhone[];
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onAdd?: (data: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  contactId?: string;
}

export const PhonesCard = memo(function PhonesCard({ phones, copiedField, onCopy, onAdd, onDelete, contactId }: Props) {
  const { getPhone, isLoading: validationLoading } = useContactValidationStatus(contactId);
  const validator = usePhoneValidator();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Telefones ({phones.length})
          </span>
          {onAdd && <AddPhoneDialog onAdd={onAdd} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {phones.length > 0 ? phones.map((p) => (
          <div key={p.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <a href={`tel:${formatPhoneDisplay(p)}`} className="font-medium text-foreground hover:text-primary transition-colors">
                  {p.numero}
                </a>
                <PrimaryBadge isPrimary={p.is_primary} />
                <VerifiedBadge isVerified={p.is_verified} />
                {p.is_whatsapp && (
                  <a href={`https://wa.me/${(p.numero_e164 || p.numero).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="text-[10px] border-success/30 text-success cursor-pointer">
                      <MessageSquare className="h-2.5 w-2.5 mr-0.5" />WhatsApp
                    </Badge>
                  </a>
                )}
                {(() => {
                  const v = getPhone(p.numero_e164 || p.numero);
                  return <EnrichmentBadge status={v?.status} detail={v?.line_type ?? undefined} loading={validationLoading && !v} compact />;
                })()}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {PHONE_TYPE_LABELS[p.phone_type] || p.phone_type}
                </Badge>
                <ConfidenceBadge value={p.confiabilidade} />
                <SourceBadge fonte={p.fonte} />
              </div>
              {p.numero_e164 && p.numero_e164 !== p.numero && (
                <p className="text-[10px] text-muted-foreground mt-0.5">E.164: {p.numero_e164}</p>
              )}
              {p.contexto && <p className="text-[10px] text-muted-foreground">{p.contexto}</p>}
              {p.observacao && <p className="text-[10px] text-muted-foreground italic">{p.observacao}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => validator.mutate({ phone: p.numero_e164 || p.numero, defaultCountry: 'BR', contactId })}
                disabled={validator.isPending}
                aria-label={`Validar ${p.numero}`}
                className="rounded p-1 text-muted-foreground hover:bg-info/10 hover:text-info transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="h-3 w-3" />
              </button>
              <button
                aria-label={`Copiar telefone ${formatPhoneDisplay(p)}`}
                onClick={() => onCopy(formatPhoneDisplay(p), `phone-${p.id}`)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {copiedField === `phone-${p.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(p.id)}
                  aria-label={`Remover telefone ${p.numero}`}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum telefone registrado</p>
        )}
      </CardContent>
    </Card>
  );
});
