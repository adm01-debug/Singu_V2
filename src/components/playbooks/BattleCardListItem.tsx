import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
 import { Swords, ChevronRight, Trophy, AlertTriangle } from "lucide-react";
 import { OptimizedImage } from "@/components/ui/optimized-image";
import { Link } from "react-router-dom";
import type { BattleCard } from "@/hooks/useBattleCards";

export function BattleCardListItem({ card }: { card: BattleCard }) {
  return (
    <Card variant="interactive">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
         {card.competitor_logo_url ? (
           <OptimizedImage 
             src={card.competitor_logo_url} 
             alt={card.competitor_name} 
             className="size-10 rounded-md object-contain bg-muted/30 p-1" 
           />
         ) : (
          <div className="size-10 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
            <Swords className="size-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold leading-tight truncate">{card.competitor_name}</h3>
          {card.summary && <p className="text-sm text-muted-foreground line-clamp-1">{card.summary}</p>}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/playbooks/battle-cards/${card.id}`}><ChevronRight className="size-4" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 text-xs">
        <Badge variant="outline" className="gap-1"><Trophy className="size-3 text-success" /> {card.win_themes.length} themes</Badge>
        <Badge variant="outline" className="gap-1"><AlertTriangle className="size-3 text-warning" /> {card.landmines.length} landmines</Badge>
        <Badge variant="outline">{card.proof_points.length} proof points</Badge>
      </CardContent>
    </Card>
  );
}
