import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCoachingScorecards, useUpsertScorecard } from "@/hooks/useConversationIntel";

export function ScorecardEditor() {
  const { data: cards } = useCoachingScorecards();
  const upsert = useUpsertScorecard();
  const [name, setName] = useState("");
  const [criteria, setCriteria] = useState("");

  const save = () => {
    if (!name.trim()) return;
    const list = criteria.split("\n").map((line) => {
      const [label, weightStr] = line.split("|").map((s) => s.trim());
      return { key: label?.toLowerCase().replace(/\s+/g, "_") ?? "", label: label ?? "", weight: Number(weightStr ?? 1) };
    }).filter((c) => c.label);
    upsert.mutate({ name: name.trim(), criteria: list, active: true }, {
      onSuccess: () => { setName(""); setCriteria(""); },
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Scorecards de Coaching</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded border border-dashed border-border p-3">
          <div>
            <Label className="text-xs">Nome do scorecard</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Discovery Call - SDR" />
          </div>
          <div>
            <Label className="text-xs">Critérios (um por linha — formato: <code>Critério | peso</code>)</Label>
            <Textarea
              rows={5}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder={"Identificou dor | 3\nConfirmou budget | 2\nAgendou próximo passo | 2"}
              className="font-mono text-xs"
            />
          </div>
          <Button onClick={save} disabled={upsert.isPending} className="gap-1"><Plus className="h-4 w-4" /> Salvar scorecard</Button>
        </div>

        <div className="space-y-2">
          {(cards ?? []).map((c) => (
            <div key={c.id} className="rounded border border-border p-2">
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {(c.criteria ?? []).length} critérios · peso total {(c.criteria ?? []).reduce((s, x) => s + x.weight, 0)}
              </p>
            </div>
          ))}
          {(cards ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhum scorecard ainda.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
