import { useEffect, useState } from "react";
import { Search, Loader2, Check, UserPlus2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmailFinder } from "@/hooks/useEnrichmentSuite";
import { useApplyFoundEmail } from "@/hooks/useApplyFoundEmail";
import { useContacts } from "@/hooks/useContacts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  contactId?: string | null;
  prefillFirstName?: string;
  prefillLastName?: string;
  prefillDomain?: string;
  /** Chamado após aplicar um email com sucesso (para fechar modais externos) */
  onApplied?: (email: string) => void;
}

export function EmailFinderWidget({
  contactId = null,
  prefillFirstName = "",
  prefillLastName = "",
  prefillDomain = "",
  onApplied,
}: Props) {
  const [firstName, setFirstName] = useState(prefillFirstName);
  const [lastName, setLastName] = useState(prefillLastName);
  const [domain, setDomain] = useState(prefillDomain);
  const [pickedContactId, setPickedContactId] = useState<string>(contactId ?? "");
  const [appliedEmails, setAppliedEmails] = useState<Set<string>>(new Set());

  const { mutate, data, isPending } = useEmailFinder();
  const apply = useApplyFoundEmail();
  const { contacts } = useContacts(undefined, { enabled: !contactId });

  // Atualiza prefill se as props mudarem (ex: dialog reabre com outro contato)
  useEffect(() => {
    if (prefillFirstName) setFirstName(prefillFirstName);
    if (prefillLastName) setLastName(prefillLastName);
    if (prefillDomain) setDomain(prefillDomain);
  }, [prefillFirstName, prefillLastName, prefillDomain]);

  useEffect(() => {
    if (contactId) setPickedContactId(contactId);
  }, [contactId]);

  const submit = () =>
    firstName && lastName && domain && mutate({ firstName, lastName, domain, contactId: pickedContactId || null });

  const handleApply = (email: string, score: number) => {
    if (!pickedContactId) return;
    apply.mutate(
      { contactId: pickedContactId, email, score, source: "email_finder" },
      {
        onSuccess: () => {
          setAppliedEmails((prev) => new Set(prev).add(email));
          onApplied?.(email);
        },
      }
    );
  };

  const contactOptions =
    contacts?.map((c) => ({
      value: c.id,
      label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "(sem nome)",
    })) ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Search className="h-4 w-4 text-info" /> Encontrar Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome" className="h-9 text-sm" />
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sobrenome" className="h-9 text-sm" />
        </div>
        <div className="flex gap-2">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="empresa.com" className="h-9 text-sm" />
          <Button size="sm" onClick={submit} disabled={!firstName || !lastName || !domain || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>

        {!contactId && data && (
          <div className="rounded-md border bg-muted/30 p-2 space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <UserPlus2 className="h-3 w-3" /> Aplicar resultado em qual contato?
            </label>
            <Select value={pickedContactId} onValueChange={setPickedContactId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecione um contato..." />
              </SelectTrigger>
              <SelectContent>
                {contactOptions.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">Nenhum contato disponível</div>
                ) : (
                  contactOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {data?.best && (
          <div className="rounded-lg border bg-success/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-medium truncate">{data.best.email}</span>
              <Badge variant="outline">Confiança {data.best.score}</Badge>
            </div>
            <Button
              size="sm"
              variant="default"
              className="w-full h-8 text-xs"
              disabled={!pickedContactId || apply.isPending || appliedEmails.has(data.best.email)}
              onClick={() => handleApply(data.best.email, data.best.score)}
            >
              {appliedEmails.has(data.best.email) ? (
                <><Check className="h-3 w-3 mr-1" /> Aplicado</>
              ) : apply.isPending ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Aplicando...</>
              ) : (
                <>Usar este email</>
              )}
            </Button>
          </div>
        )}

        {data?.candidates && data.candidates.length > 1 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Ver {data.candidates.length} candidatos</summary>
            <ul className="mt-2 space-y-1.5">
              {data.candidates.slice(0, 8).map((c) => {
                const applied = appliedEmails.has(c.email);
                return (
                  <li key={c.email} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono truncate">{c.email}</span>
                      <span className="text-muted-foreground text-[10px] flex-shrink-0">{c.score}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] flex-shrink-0"
                      disabled={!pickedContactId || apply.isPending || applied}
                      onClick={() => handleApply(c.email, c.score)}
                    >
                      {applied ? <Check className="h-3 w-3" /> : "Usar"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
