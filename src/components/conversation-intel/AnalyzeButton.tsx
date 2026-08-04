import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useAnalyzeConversation } from "@/hooks/useConversationIntel";
import { cn } from "@/lib/utils";

interface Props {
  interactionId: string;
  hasAnalysis?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
  className?: string;
}

export function AnalyzeButton({ interactionId, hasAnalysis, variant = "outline", size = "sm", className }: Props) {
  const m = useAnalyzeConversation();
  return (
    <Button
      variant={variant}
      size={size}
      disabled={m.isPending}
      onClick={() => m.mutate({ interactionId, force: !!hasAnalysis })}
      className={cn("gap-1.5", className)}
    >
      {m.isPending
        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        : <Sparkles className="h-3.5 w-3.5" />}
      {m.isPending ? "Analisando..." : hasAnalysis ? "Reanalisar" : "Analisar com IA"}
    </Button>
  );
}
