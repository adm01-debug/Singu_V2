import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart } from "lucide-react";
import { useRoomHealth, type DealRoom } from "@/hooks/useDealRooms";

export function RoomHealthCard({ room }: { room: DealRoom }) {
  const analyze = useRoomHealth();
  const score = room.health_score;
  const tone = !score ? "muted" : score >= 70 ? "success" : score >= 40 ? "warning" : "destructive";

  return (
    <Card variant={tone === "muted" ? "default" : tone}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" />Health do Room</CardTitle>
          <Button size="sm" variant="outline" onClick={() => analyze.mutate(room.id)} disabled={analyze.isPending}>
            <Sparkles className="h-4 w-4" />{analyze.isPending ? "Analisando..." : "Analisar com IA"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {score !== null && score !== undefined ? (
          <>
            <div className="text-4xl font-bold">{score}<span className="text-lg text-muted-foreground">/100</span></div>
            <ul className="space-y-1.5 text-sm">
              {(room.health_recommendations ?? []).map((r, i) => (
                <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{r}</span></li>
              ))}
            </ul>
            {room.health_analyzed_at && (
              <p className="text-xs text-muted-foreground">Analisado em {new Date(room.health_analyzed_at).toLocaleString("pt-BR")}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">Clique em "Analisar com IA" para gerar a saúde do room.</p>
        )}
      </CardContent>
    </Card>
  );
}
