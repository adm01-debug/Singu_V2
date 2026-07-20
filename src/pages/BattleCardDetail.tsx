import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Swords, Loader2 } from "lucide-react";
import { SmartBackButton } from "@/components/navigation/SmartBackButton";
import { useBattleCard } from "@/hooks/useBattleCards";
import { BattleCardView } from "@/components/playbooks/BattleCardView";
import { useLogPlaybookUsage } from "@/hooks/usePlaybooks";
import { useEffect } from "react";

export default function BattleCardDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: card, isLoading } = useBattleCard(id);
  const log = useLogPlaybookUsage();

  useEffect(() => {
    if (card?.id) log.mutate({ battle_card_id: card.id, action: "opened" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  if (isLoading) return <div className="container mx-auto px-4 py-12 flex justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (!card) return <div className="container mx-auto px-4 py-12 text-center">
    <p className="text-muted-foreground mb-4">Battle card não encontrado</p>
    <SmartBackButton fallback="/playbooks" label="Voltar para Playbooks" />
  </div>;

  return (
    <>
      <Helmet><title>Battle Card: {card.competitor_name} | SINGU</title></Helmet>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <SmartBackButton fallback="/playbooks" />
        </div>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            {card.competitor_logo_url ? (
              <img 
                src={card.competitor_logo_url} 
                alt={card.competitor_name} 
                className="size-16 rounded-lg object-contain bg-muted/30 p-2" 
                loading="lazy" 
                decoding="async" 
              />
            ) : (
              <div className="size-16 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <Swords className="size-8" />
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{card.competitor_name}</h1>
              {card.summary && <p className="text-muted-foreground">{card.summary}</p>}
            </div>
          </CardContent>
        </Card>

        <BattleCardView card={card} />
      </div>
    </>
  );
}
