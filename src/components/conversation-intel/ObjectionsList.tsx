import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  objections: Array<{ objection: string; category: string; handled: boolean; suggested_response?: string }>;
}

export function ObjectionsList({ objections }: Props) {
  if (!objections?.length) {
    return <p className="text-xs text-muted-foreground">Nenhuma objeção identificada.</p>;
  }
  return (
    <ul className="space-y-2">
      {objections.map((o, i) => (
        <li key={i} className="rounded border border-border bg-card/50 p-2 space-y-1">
          <div className="flex items-start gap-2">
            {o.handled
              ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              : <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{o.objection}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">{o.category}</Badge>
            </div>
          </div>
          {!o.handled && o.suggested_response && (
            <p className="text-[11px] text-muted-foreground border-l-2 border-warning pl-2 italic">
              💡 {o.suggested_response}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
