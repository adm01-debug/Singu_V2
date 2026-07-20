import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePublicDealRoom, recordBuyerView, buyerToggleMilestone, buyerAddComment } from "@/hooks/useDealRooms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Briefcase, Calendar, FileText, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function PublicDealRoom() {
  const { token } = useParams();
  const { data, isLoading } = usePublicDealRoom(token);
  const qc = useQueryClient();
  const [label, setLabel] = useState(localStorage.getItem("dr_buyer_label") ?? "");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (token) recordBuyerView(token, label || undefined).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (isLoading) return <div className="min-h-screen grid place-items-center">Carregando...</div>;
  if (!data?.room) return <div className="min-h-screen grid place-items-center text-muted-foreground">Deal room indisponível ou link expirado.</div>;

  const { room, milestones, stakeholders, documents, comments } = data;

  const onToggle = async (mid: string, done: boolean) => {
    try {
      await buyerToggleMilestone(token!, mid, done, label || "Comprador");
      await qc.invalidateQueries({ queryKey: ["deal_rooms", "public", token] });
    } catch (e) { 
      const msg = e instanceof Error ? e.message : "Não foi possível atualizar";
      toast.error(msg); 
    }
  };

  const onComment = async () => {
    if (!comment.trim()) return;
    try {
      await buyerAddComment(token!, comment, label || "Comprador");
      setComment("");
      await qc.invalidateQueries({ queryKey: ["deal_rooms", "public", token] });
      toast.success("Comentário enviado");
    } catch (e) { 
      const msg = e instanceof Error ? e.message : "Falha ao comentar";
      toast.error(msg); 
    }
  };

  const saveLabel = (v: string) => {
    setLabel(v);
    localStorage.setItem("dr_buyer_label", v);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Briefcase className="h-3.5 w-3.5" />Deal Room
          </div>
          <h1 className="text-2xl font-bold">{room.title}</h1>
          {room.deal_name && <p className="text-sm text-muted-foreground">{room.deal_name}</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="outline">{room.status}</Badge>
            {room.target_close_date && (
              <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" />{new Date(room.target_close_date).toLocaleDateString("pt-BR")}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <Card variant="outlined">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Como prefere ser identificado?</span>
            <Input className="max-w-xs" placeholder="Seu nome" value={label} onChange={(e) => saveLabel(e.target.value)} />
          </CardContent>
        </Card>

        {room.description && (
          <Card variant="outlined"><CardContent className="p-4 text-sm whitespace-pre-wrap">{room.description}</CardContent></Card>
        )}

        <Card variant="outlined">
          <CardHeader><CardTitle className="text-base">Plano de Ação</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {milestones.length === 0 && <p className="text-sm text-muted-foreground italic">Sem milestones</p>}
            {milestones.map((m) => {
              const buyerCanToggle = m.owner_side !== "seller";
              return (
                <div key={m.id} className="flex items-start gap-3 p-2 rounded border border-border/60">
                  <Checkbox
                    checked={m.status === "done"}
                    disabled={!buyerCanToggle}
                    onCheckedChange={(v) => onToggle(m.id, !!v)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${m.status === "done" ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                    {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{m.owner_side === "seller" ? "Vendedor" : m.owner_side === "buyer" ? "Comprador" : "Ambos"}</Badge>
                      {m.due_date && <Badge variant="outline" className="text-xs">{new Date(m.due_date).toLocaleDateString("pt-BR")}</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="outlined">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Equipe</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {stakeholders.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{s.name}</span>
                  {s.role_title && <span className="text-muted-foreground text-xs">— {s.role_title}</span>}
                  <Badge variant="outline" className="text-xs ml-auto">{s.side === "buyer" ? "Vocês" : "Nós"}</Badge>
                </div>
              ))}
              {!stakeholders.length && <p className="text-sm text-muted-foreground italic">Sem stakeholders</p>}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Documentos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{d.title}</span>
                  <Badge variant="outline" className="text-xs">{((d.file_size ?? 0) / 1024).toFixed(0)} KB</Badge>
                </div>
              ))}
              {!documents.length && <p className="text-sm text-muted-foreground italic">Sem documentos</p>}
            </CardContent>
          </Card>
        </div>

        <Card variant="outlined">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />Conversa</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="border border-border/60 rounded p-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.author_label}</span>
                  <Badge variant={c.author_side === "buyer" ? "secondary" : "outline"} className="text-xs">{c.author_side === "buyer" ? "Vocês" : "Nós"}</Badge>
                  <span className="ml-auto">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
            {!comments.length && <p className="text-sm text-muted-foreground italic">Sem comentários</p>}
            <div className="space-y-2">
              <Textarea placeholder="Deixe um comentário..." value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="flex justify-end"><Button size="sm" onClick={onComment} disabled={!comment.trim()}>Enviar</Button></div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
