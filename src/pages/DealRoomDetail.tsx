import { useParams } from "react-router-dom";
import { useDealRoom, useMilestones, useStakeholders } from "@/hooks/useDealRooms";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, Eye, Target, type LucideIcon } from "lucide-react";
import { SmartBackButton } from "@/components/navigation/SmartBackButton";
import { MilestoneKanban } from "@/components/deal-rooms/MilestoneKanban";
import { StakeholderList } from "@/components/deal-rooms/StakeholderList";
import { DocumentsList } from "@/components/deal-rooms/DocumentsList";
import { ActivityFeed } from "@/components/deal-rooms/ActivityFeed";
import { CommentsThread } from "@/components/deal-rooms/CommentsThread";
import { ShareDialog } from "@/components/deal-rooms/ShareDialog";
import { RoomHealthCard } from "@/components/deal-rooms/RoomHealthCard";

export default function DealRoomDetail() {
  const { id } = useParams();
  const { data: room, isLoading } = useDealRoom(id);
  const { data: ms = [] } = useMilestones(id);
  const { data: sh = [] } = useStakeholders(id);

  if (isLoading) return <div className="container mx-auto p-6">Carregando...</div>;
  if (!room) return <div className="container mx-auto p-6">Deal room não encontrado.</div>;

  const total = ms.length;
  const done = ms.filter((m) => m.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const daysLeft = room.target_close_date
    ? Math.ceil((new Date(room.target_close_date).getTime() - Date.now()) / 86400000)
    : null;
  const buyerEng = sh.filter((s) => s.side === "buyer").filter((s) => (s.engagement_score ?? 0) >= 50).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <SmartBackButton fallback="/deal-rooms" label="Voltar para Deal Rooms" />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{room.title}</h1>
          {room.deal_name && <p className="text-sm text-muted-foreground">{room.deal_name}</p>}
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{room.status}</Badge>
            {room.deal_value && <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" />{room.deal_value.toLocaleString("pt-BR")}</Badge>}
            {room.target_close_date && <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" />{new Date(room.target_close_date).toLocaleDateString("pt-BR")}</Badge>}
          </div>
        </div>
        <ShareDialog room={room} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Target} label="Plano" value={`${pct}%`} sub={`${done}/${total}`} />
        <Kpi icon={Calendar} label="Dias até close" value={daysLeft !== null ? String(daysLeft) : "—"} sub={daysLeft !== null && daysLeft < 0 ? "atrasado" : ""} />
        <Kpi icon={Target} label="Stakeholders engajados" value={String(buyerEng)} sub={`de ${sh.filter((s) => s.side === "buyer").length}`} />
        <Kpi icon={Eye} label="Buyer views" value={String(room.buyer_view_count)} sub={room.last_buyer_view_at ? new Date(room.last_buyer_view_at).toLocaleDateString("pt-BR") : "—"} />
      </div>

      <Tabs defaultValue="plan">
        <TabsList>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
          <TabsTrigger value="comments">Comentários</TabsTrigger>
          <TabsTrigger value="health">Health IA</TabsTrigger>
        </TabsList>
        <TabsContent value="plan"><MilestoneKanban roomId={room.id} /></TabsContent>
        <TabsContent value="stakeholders"><StakeholderList roomId={room.id} /></TabsContent>
        <TabsContent value="documents"><DocumentsList roomId={room.id} /></TabsContent>
        <TabsContent value="activity"><ActivityFeed roomId={room.id} /></TabsContent>
        <TabsContent value="comments"><CommentsThread roomId={room.id} /></TabsContent>
        <TabsContent value="health"><RoomHealthCard room={room} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: string; sub?: string }) {
  return (
    <Card variant="outlined">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Icon className="h-3.5 w-3.5" />{label}</div>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
