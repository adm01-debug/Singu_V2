import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { useTopicsCatalog, useUpsertTopic, useDeleteTopic, useSeedTopics, type ConversationTopic } from "@/hooks/useConversationIntel";

const CATEGORIES: ConversationTopic["category"][] = ["product", "pricing", "competition", "objection", "closing", "discovery", "other"];

export function TopicsEditor() {
  const { data: topics, isLoading } = useTopicsCatalog();
  const upsert = useUpsertTopic();
  const del = useDeleteTopic();
  const seed = useSeedTopics();
  const [draft, setDraft] = useState({ topic_key: "", label: "", category: "discovery" as ConversationTopic["category"], keywords: "" });

  const submit = () => {
    if (!draft.topic_key.trim() || !draft.label.trim()) return;
    upsert.mutate({
      topic_key: draft.topic_key.trim().toLowerCase().replace(/\s+/g, "_"),
      label: draft.label.trim(),
      category: draft.category,
      keywords: draft.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      active: true,
    }, { onSuccess: () => setDraft({ topic_key: "", label: "", category: "discovery", keywords: "" }) });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Catálogo de Tópicos</CardTitle>
          {(topics?.length ?? 0) === 0 && (
            <Button variant="outline" size="sm" onClick={() => seed.mutate()} disabled={seed.isPending} className="gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Criar 12 padrão
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <div className="md:col-span-1">
            <Label className="text-xs">Chave</Label>
            <Input value={draft.topic_key} onChange={(e) => setDraft({ ...draft, topic_key: e.target.value })} placeholder="pricing_disc" />
          </div>
          <div className="md:col-span-1">
            <Label className="text-xs">Rótulo</Label>
            <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="Discussão de Preço" />
          </div>
          <div>
            <Label className="text-xs">Categoria</Label>
            <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v as ConversationTopic["category"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <Label className="text-xs">Keywords (vírgula)</Label>
            <Input value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} placeholder="preço, valor" />
          </div>
          <Button onClick={submit} disabled={upsert.isPending} className="gap-1"><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="space-y-1 max-h-[400px] overflow-auto">
            {(topics ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded border border-border p-2 hover:bg-muted/30">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                  <span className="text-sm font-medium truncate">{t.label}</span>
                  <span className="text-xs text-muted-foreground">({t.keywords.slice(0, 3).join(", ")}{t.keywords.length > 3 ? "..." : ""})</span>
                </div>
                <Button variant="ghost" size="icon" aria-label="Remover" className="h-7 w-7" onClick={() => del.mutate(t.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            {(topics ?? []).length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum tópico ainda.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
