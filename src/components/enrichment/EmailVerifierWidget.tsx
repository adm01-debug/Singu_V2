import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmailVerifier } from "@/hooks/useEnrichmentSuite";

const ICON: Record<string, React.ReactNode> = {
  valid: <CheckCircle2 className="h-4 w-4 text-success" />,
  risky: <AlertTriangle className="h-4 w-4 text-warning" />,
  invalid: <XCircle className="h-4 w-4 text-destructive" />,
  unknown: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
  catchall: <HelpCircle className="h-4 w-4 text-info" />,
};

interface Props { defaultEmail?: string; contactId?: string | null; compact?: boolean }

export function EmailVerifierWidget({ defaultEmail = "", contactId = null, compact = false }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const { mutate, data, isPending } = useEmailVerifier();

  const submit = () => email && mutate({ email, contactId });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-primary" /> Verificar Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" className="h-9 text-sm" />
          <Button size="sm" onClick={submit} disabled={!email || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
          </Button>
        </div>
        {data && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              {ICON[data.status]}
              <span className="font-medium text-sm capitalize">{data.status}</span>
              <Badge variant="outline" className="ml-auto">Score {data.score}</Badge>
            </div>
            {!compact && (
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>MX: {data.mx_found ? "✓" : "✗"}</span>
                <span>Descartável: {data.disposable ? "✗" : "✓"}</span>
                <span>Conta genérica: {data.role_account ? "Sim" : "Não"}</span>
                <span>Provedor grátis: {data.free_provider ? "Sim" : "Não"}</span>
              </div>
            )}
            {data.reasons?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.reasons.map((r) => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
