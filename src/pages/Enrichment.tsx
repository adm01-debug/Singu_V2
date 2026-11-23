import { useMemo } from "react";
import { Sparkles, Mail, Phone, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailVerifierWidget } from "@/components/enrichment/EmailVerifierWidget";
import { EmailFinderWidget } from "@/components/enrichment/EmailFinderWidget";
import { PhoneValidatorWidget } from "@/components/enrichment/PhoneValidatorWidget";
import { PeopleIntelTimeline } from "@/components/enrichment/PeopleIntelTimeline";
import { ValidationQueueCard } from "@/components/enrichment/ValidationQueueCard";
import { BulkRevalidateCard } from "@/components/enrichment/BulkRevalidateCard";
import { EnrichmentCoverageCard } from "@/components/enrichment/EnrichmentCoverageCard";
import { EnrichmentExportButton } from "@/components/enrichment/EnrichmentExportButton";
import { useEmailVerifications, usePhoneValidations, useEmailFinderResults } from "@/hooks/useEnrichmentSuite";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Enrichment() {
  const { data: emails = [] } = useEmailVerifications();
  const { data: phones = [] } = usePhoneValidations();
  const { data: finderResults = [] } = useEmailFinderResults();

  const stats = useMemo(() => {
    const validEmails = emails.filter((e) => e.status === "valid").length;
    const validPhones = phones.filter((p) => p.status === "valid").length;
    return {
      emailsTotal: emails.length,
      emailsValid: validEmails,
      emailsRate: emails.length ? Math.round((validEmails / emails.length) * 100) : 0,
      phonesTotal: phones.length,
      phonesValid: validPhones,
      phonesRate: phones.length ? Math.round((validPhones / phones.length) * 100) : 0,
    };
  }, [emails, phones]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Enriquecimento de Dados
          </h1>
          <p className="text-sm text-muted-foreground">
            Valide emails, encontre contatos, verifique telefones e acompanhe mudanças de carreira.
          </p>
        </div>
        <EnrichmentExportButton />
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Mail className="h-3.5 w-3.5" />Emails verificados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{stats.emailsTotal}</p><p className="text-xs text-muted-foreground">{stats.emailsValid} válidos ({stats.emailsRate}%)</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Phone className="h-3.5 w-3.5" />Telefones validados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{stats.phonesTotal}</p><p className="text-xs text-muted-foreground">{stats.phonesValid} válidos ({stats.phonesRate}%)</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Search className="h-3.5 w-3.5" />Custo</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-success">R$ 0</p><p className="text-xs text-muted-foreground">100% server-side, sem APIs pagas</p></CardContent>
        </Card>
      </section>

      <EnrichmentCoverageCard />

      <section className="grid gap-4 lg:grid-cols-2">
        <div id="validation-queue-card"><ValidationQueueCard /></div>
        <BulkRevalidateCard />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <EmailVerifierWidget />
        <EmailFinderWidget />
        <PhoneValidatorWidget />
        <PeopleIntelTimeline />
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" /> Últimas buscas de email ({finderResults.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {finderResults.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma busca de email registrada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {finderResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-xs truncate">{r.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {r.best_email ?? 'sem resultado'} · {r.domain}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {Math.round((r.best_confidence ?? 0) * 100)}%
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(r.found_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
