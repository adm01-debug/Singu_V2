import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useRevOpsAlerts, useDismissAlert } from "@/hooks/useRevOps";

export function RevOpsAlertList() {
  const { data: alerts = [] } = useRevOpsAlerts();
  const dismiss = useDismissAlert();

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(a => {
        const Icon = a.severity === "critical" ? AlertCircle : a.severity === "warning" ? AlertTriangle : Info;
        const variant = a.severity === "critical" ? "destructive" : "default";
        return (
          <Alert key={a.id} variant={variant} className="pr-12 relative">
            <Icon className="h-4 w-4" />
            <AlertTitle className="capitalize">{a.metric_key.replace(/_/g, " ")}</AlertTitle>
            <AlertDescription>{a.message}</AlertDescription>
            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => dismiss.mutate(a.id)}>
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        );
      })}
    </div>
  );
}
