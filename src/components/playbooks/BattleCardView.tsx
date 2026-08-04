import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, AlertTriangle, ShieldCheck, Quote } from "lucide-react";
import type { BattleCard } from "@/hooks/useBattleCards";

export function BattleCardView({ card }: { card: BattleCard }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="success">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" /> Nossas Forças
            </h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {card.our_strengths.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma força cadastrada.</p>}
            {card.our_strengths.map((s, i) => (
              <div key={i} className="rounded-md border border-border/50 bg-card/60 p-3">
                <p className="text-sm font-medium">{s.title}</p>
                {s.detail && <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="warning">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="size-4 text-warning" /> Forças Deles
            </h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {card.their_strengths.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
            {card.their_strengths.map((s, i) => (
              <div key={i} className="rounded-md border border-border/50 bg-card/60 p-3">
                <p className="text-sm font-medium">{s.title}</p>
                {s.detail && <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card variant="destructive">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" /> Fraquezas Deles
          </h3>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {card.weaknesses.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          {card.weaknesses.map((w, i) => (
            <div key={i} className="rounded-md border border-border/50 bg-card/60 p-3">
              <p className="text-sm font-medium">{w.title}</p>
              {w.detail && <p className="text-xs text-muted-foreground mt-0.5">{w.detail}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {card.pricing_comparison && (
        <Card>
          <CardHeader className="pb-2"><h3 className="text-sm font-semibold">Comparação de Preço</h3></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-line">{card.pricing_comparison}</p></CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><h3 className="text-sm font-semibold flex items-center gap-2"><Trophy className="size-4 text-success" /> Win Themes</h3></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {card.win_themes.map((t, i) => <Badge key={i} variant="default">{t}</Badge>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><h3 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="size-4 text-warning" /> Landmines</h3></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {card.landmines.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}
          </CardContent>
        </Card>
      </div>

      {card.proof_points.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><h3 className="text-sm font-semibold flex items-center gap-2"><Quote className="size-4 text-primary" /> Proof Points</h3></CardHeader>
          <CardContent className="space-y-2">
            {card.proof_points.map((p, i) => (
              <div key={i} className="rounded-md border border-border/50 bg-muted/20 p-3">
                <p className="text-sm font-medium">{p.client}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{p.result}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
