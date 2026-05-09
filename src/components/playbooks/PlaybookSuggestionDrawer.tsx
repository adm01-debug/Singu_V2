import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, Loader2, Swords, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecommendPlaybooks, useLogPlaybookUsage, SCENARIO_LABELS, type SalesPlaybook } from "@/hooks/usePlaybooks";
import { type BattleCard } from "@/hooks/useBattleCards";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: {
    contact_id?: string;
    deal_id?: string;
    current_stage?: string;
    industry?: string;
    persona?: string;
    competitor_mentioned?: string;
    recent_topics?: string[];
  };
}

export function PlaybookSuggestionDrawer({ open, onOpenChange, context }: Props) {
  const recommend = useRecommendPlaybooks();
  const log = useLogPlaybookUsage();
  const [data, setData] = useState<{ 
    recommendations: Array<{ playbook: SalesPlaybook; score: number; reasons: string[] }>; 
    battle_card?: BattleCard; 
  } | null>(null);

  useEffect(() => {
    if (open && !recommend.isPending) {
      recommend.mutateAsync(context).then(setData).catch(() => setData(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" /> Sugestões para esta oportunidade</SheetTitle>
          <SheetDescription>Playbooks recomendados com base no contexto do deal.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {recommend.isPending && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" /> Calculando…
            </div>
          )}

          {!recommend.isPending && data?.battle_card && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Swords className="size-4 text-destructive" />
                <h3 className="text-sm font-semibold">Concorrente detectado: {data.battle_card.competitor_name}</h3>
              </div>
              {data.battle_card.summary && <p className="text-xs text-muted-foreground">{data.battle_card.summary}</p>}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to={`/playbooks/battle-cards/${data.battle_card.id}`} onClick={() => log.mutate({ battle_card_id: data.battle_card.id, action: "opened", contact_id: context.contact_id, deal_id: context.deal_id })}>
                  Abrir Battle Card <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}

          {!recommend.isPending && data?.recommendations?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum playbook relevante encontrado. <br/>Crie um novo na biblioteca.</p>
          )}

          {!recommend.isPending && data?.recommendations?.map((rec) => (
            <div key={rec.playbook.id} className="rounded-lg border border-border/60 bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{SCENARIO_LABELS[rec.playbook.scenario as keyof typeof SCENARIO_LABELS]}</Badge>
                    <Badge variant="default" className="text-xs">{Math.round(rec.score)} pts</Badge>
                  </div>
                  <h4 className="text-sm font-semibold leading-tight">{rec.playbook.name}</h4>
                </div>
                <BookOpen className="size-4 text-primary shrink-0" />
              </div>
              {rec.reasons?.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {rec.reasons.slice(0, 2).map((r: string, i: number) => <li key={i}>• {r}</li>)}
                </ul>
              )}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to={`/playbooks/${rec.playbook.id}`} onClick={() => log.mutate({ playbook_id: rec.playbook.id, action: "opened", contact_id: context.contact_id, deal_id: context.deal_id })}>
                  Abrir playbook <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
