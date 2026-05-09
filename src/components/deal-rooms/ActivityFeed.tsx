import { useRoomActivities, type DealRoomActivity } from "@/hooks/useDealRooms";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, CheckCircle2, MessageSquare, Upload } from "lucide-react";

const ICONS: Record<string, React.ComponentType<any>> = {
  view: Eye,
  milestone_completed: CheckCircle2,
  milestone_reopened: CheckCircle2,
  comment: MessageSquare,
  doc_uploaded: Upload,
  doc_viewed: Eye,
};

export function ActivityFeed({ roomId }: { roomId: string }) {
  const { data = [] } = useRoomActivities(roomId);
  return (
    <div className="space-y-2">
      {data.map((a: DealRoomActivity) => {
        const Icon = ICONS[a.activity_type] ?? Eye;
        return (
          <Card key={a.id} className="border shadow-none">
            <CardContent className="p-3 flex items-start gap-3">
              <Icon className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{a.actor_label || (a.actor_side === "buyer" ? "Comprador" : "Vendedor")}</span>{" "}
                  <span className="text-muted-foreground">— {a.activity_type.replace(/_/g, " ")}</span>
                </p>
                <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {!data.length && <p className="text-sm text-muted-foreground italic text-center py-6">Sem atividade ainda</p>}
    </div>
  );
}
