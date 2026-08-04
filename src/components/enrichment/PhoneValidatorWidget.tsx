import { useState } from "react";
import { Phone, Loader2, CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePhoneValidator } from "@/hooks/useEnrichmentSuite";

const ICON: Record<string, React.ReactNode> = {
  valid: <CheckCircle2 className="h-4 w-4 text-success" />,
  unreachable: <AlertTriangle className="h-4 w-4 text-warning" />,
  invalid: <XCircle className="h-4 w-4 text-destructive" />,
  unknown: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
};

export function PhoneValidatorWidget({ defaultPhone = "", contactId = null }: { defaultPhone?: string; contactId?: string | null }) {
  const [phone, setPhone] = useState(defaultPhone);
  const { mutate, data, isPending } = usePhoneValidator();

  const submit = () => phone && mutate({ phone, contactId });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-accent" /> Validar Telefone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 99999-9999" className="h-9 text-sm" />
          <Button size="sm" onClick={submit} disabled={!phone || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}
          </Button>
        </div>
        {data && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              {ICON[data.status]}
              <span className="font-medium text-sm capitalize">{data.status}</span>
              {data.line_type && <Badge variant="outline" className="ml-auto">{data.line_type}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <span>E.164: {data.phone_e164 ?? "—"}</span>
              <span>País: {data.country ?? "—"}</span>
            </div>
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
