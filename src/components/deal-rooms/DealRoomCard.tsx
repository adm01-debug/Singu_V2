import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, Target } from "lucide-react";
import { Link } from "react-router-dom";
import type { DealRoom } from "@/hooks/useDealRooms";
import { useMilestones } from "@/hooks/useDealRooms";
import { Progress } from "@/components/ui/progress";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  won: "secondary",
  lost: "destructive",
  paused: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  won: "Ganho",
  lost: "Perdido",
  paused: "Pausado",
};

export function DealRoomCard({ room }: { room: DealRoom }) {
  const { data: ms } = useMilestones(room.id);
  const total = ms?.length ?? 0;
  const done = ms?.filter((m) => m.status === "done").length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const next = ms?.find((m) => m.status !== "done");

  const lastView = room.last_buyer_view_at
    ? `${Math.round((Date.now() - new Date(room.last_buyer_view_at).getTime()) / 86400000)}d atrás`
    : "Sem visitas";

  return (
    <Link to={`/deal-rooms/${room.id}`}>
      <Card variant="interactive" className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-1">{room.title}</CardTitle>
            <Badge variant={STATUS_VARIANT[room.status]}>{STATUS_LABEL[room.status]}</Badge>
          </div>
          {room.deal_name && <p className="text-xs text-muted-foreground line-clamp-1">{room.deal_name}</p>}
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Plano de ação</span>
              <span className="font-medium">{done}/{total}</span>
            </div>
            <Progress value={pct} />
          </div>
          {next && (
            <div className="flex items-center gap-2 text-xs">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="line-clamp-1">{next.title}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{room.buyer_view_count} views · {lastView}</span>
            {room.target_close_date && (
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(room.target_close_date).toLocaleDateString("pt-BR")}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
