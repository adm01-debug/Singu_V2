import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useForecastNarrative } from "@/hooks/useForecasting";
import { useState } from "react";

export function ForecastNarrativeCard({ periodId }: { periodId: string }) {
  const { mutate, isPending } = useForecastNarrative();
  const [text, setText] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Narrativa Executiva</CardTitle>
        <Button size="sm" variant="outline" onClick={() => mutate(periodId, { onSuccess: (d) => setText(d.narrative) })} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {text ? "Regenerar" : "Gerar com IA"}
        </Button>
      </CardHeader>
      <CardContent>
        {text ? (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">{text}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Clique em "Gerar com IA" para uma análise executiva do forecast atual.</p>
        )}
      </CardContent>
    </Card>
  );
}
