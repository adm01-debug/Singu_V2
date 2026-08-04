import { TrendingUp, Briefcase, Building2, UserCog, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePeopleIntelligenceEvents } from "@/hooks/useEnrichmentSuite";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ICON: Record<string, React.ReactNode> = {
  promotion: <TrendingUp className="h-4 w-4 text-success" />,
  job_change: <Briefcase className="h-4 w-4 text-primary" />,
  company_change: <Building2 className="h-4 w-4 text-info" />,
  title_change: <UserCog className="h-4 w-4 text-warning" />,
  linkedin_update: <Sparkles className="h-4 w-4 text-accent" />,
  social_event: <Sparkles className="h-4 w-4 text-accent" />,
  other: <Sparkles className="h-4 w-4 text-muted-foreground" />,
};

const LABEL: Record<string, string> = {
  promotion: "Promoção",
  job_change: "Mudança de cargo",
  company_change: "Mudança de empresa",
  title_change: "Novo cargo",
  linkedin_update: "Atualização LinkedIn",
  social_event: "Evento social",
  other: "Outro",
};

export function PeopleIntelTimeline({ contactId, limit = 20 }: { contactId?: string; limit?: number }) {
  const { data: events = [], isLoading } = usePeopleIntelligenceEvents(contactId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" /> People Intelligence
          {events.length > 0 && <Badge variant="secondary" className="ml-auto">{events.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum evento detectado ainda.</p>
        ) : (
          <ul className="space-y-3">
            {events.slice(0, limit).map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <div className="mt-0.5">{ICON[e.event_type] ?? ICON.other}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{LABEL[e.event_type] ?? e.event_type}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(e.detected_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {(e.old_value || e.new_value) && (
                    <p className="text-xs text-muted-foreground">
                      {e.old_value ? <><span className="line-through">{e.old_value}</span> → </> : null}
                      <span className="text-foreground">{e.new_value ?? "—"}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
