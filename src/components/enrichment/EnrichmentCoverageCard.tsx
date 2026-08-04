import { Mail, Phone, Sparkles, AtSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnrichmentCoverage } from "@/hooks/useEnrichmentCoverage";

type Row = {
  icon: typeof Mail;
  label: string;
  pct: number;
  count: number;
  total: number;
  hint: string;
  indicatorClass: string;
};

export function EnrichmentCoverageCard() {
  const { data, isLoading } = useEnrichmentCoverage();

  const rows: Row[] = data
    ? [
        {
          icon: AtSign,
          label: "Contatos com email cadastrado",
          pct: data.withEmailPct,
          count: data.withEmail,
          total: data.totalContacts,
          hint: "Contatos cuja coluna email não está vazia",
          indicatorClass: "bg-primary",
        },
        {
          icon: Mail,
          label: "Emails validados (status=valid)",
          pct: data.emailsValidPct,
          count: data.emailsValid,
          total: data.totalContacts,
          hint: "Contatos com pelo menos 1 verificação de email com status=valid",
          indicatorClass: "bg-success",
        },
        {
          icon: Phone,
          label: "Telefones validados (status=valid)",
          pct: data.phonesValidPct,
          count: data.phonesValid,
          total: data.totalContacts,
          hint: "Contatos com pelo menos 1 validação de telefone com status=valid",
          indicatorClass: "bg-info",
        },
        {
          icon: Sparkles,
          label: "Com sinais de inteligência (People Intel)",
          pct: data.withIntelPct,
          count: data.withIntel,
          total: data.totalContacts,
          hint: "Contatos com pelo menos 1 evento de mudança de cargo/empresa detectado",
          indicatorClass: "bg-warning",
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Cobertura de enriquecimento
          {data && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {data.totalContacts} contatos
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculando…
          </div>
        ) : (
          <TooltipProvider delayDuration={150}>
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1.5 cursor-help">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {r.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        {r.hint}
                      </TooltipContent>
                    </Tooltip>
                    <span className="font-medium tabular-nums">
                      {r.count}/{r.total} <span className="text-muted-foreground">({r.pct}%)</span>
                    </span>
                  </div>
                  <Progress value={r.pct} className="h-1.5" indicatorClassName={r.indicatorClass} />
                </div>
              );
            })}
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
