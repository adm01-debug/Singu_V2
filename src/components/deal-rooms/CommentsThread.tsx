import { useState } from "react";
import { useRoomComments, useAddComment, type DealRoomComment } from "@/hooks/useDealRooms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function CommentsThread({ roomId }: { roomId: string }) {
  const { data = [] } = useRoomComments(roomId);
  const add = useAddComment(roomId);
  const [body, setBody] = useState("");

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {data.map((c: DealRoomComment) => (
          <Card key={c.id} className="border shadow-none">
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{c.author_label}</span>
                <Badge variant={c.author_side === "buyer" ? "secondary" : "outline"} className="text-xs">
                  {c.author_side === "buyer" ? "Comprador" : "Vendedor"}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </CardContent>
          </Card>
        ))}
        {!data.length && <p className="text-sm text-muted-foreground italic text-center py-6">Sem comentários</p>}
      </div>
      <Card className="border shadow-none">
        <CardContent className="p-3 space-y-2">
          <Textarea placeholder="Escreva um comentário..." value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
          <div className="flex justify-end">
            <Button size="sm" onClick={async () => { if (body.trim()) { try { await add.mutateAsync(body); setBody(""); } catch { /* mutation onError handles toast */ } } }} disabled={add.isPending || !body.trim()}>
              Comentar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
