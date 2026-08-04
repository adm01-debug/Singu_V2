import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target } from "lucide-react";
import { useConversationAnalysis } from "@/hooks/useConversationIntel";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachingScoreBadge } from "./CoachingScoreBadge";
import { TalkRatioBar } from "./TalkRatioBar";
import { SentimentTimeline } from "./SentimentTimeline";
import { ObjectionsList } from "./ObjectionsList";
import { KeyMomentsTimeline } from "./KeyMomentsTimeline";
import { Badge } from "@/components/ui/badge";
import { AnalyzeButton } from "./AnalyzeButton";

interface Props {
  interactionId: string;
  hasContent: boolean;
}

export function ConversationAnalysisCard({ interactionId, hasContent }: Props) {
  const { data, isLoading } = useConversationAnalysis(interactionId);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data && !hasContent) return null;
  if (!data) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <AnalyzeButton interactionId={interactionId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Brain className="h-4 w-4 text-primary" />
            Conversation Intelligence
          </CardTitle>
          <div className="flex items-center gap-2">
            <CoachingScoreBadge score={data.coaching_score} />
            <AnalyzeButton interactionId={interactionId} hasAnalysis />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <TalkRatioBar rep={data.talk_ratio_rep} customer={data.talk_ratio_customer} />

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Sentimento ao longo da conversa</p>
          <SentimentTimeline timeline={data.sentiment_timeline} />
        </div>

        {data.topics?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">Tópicos detectados</p>
            <div className="flex flex-wrap gap-1">
              {data.topics.map((t, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {t.label} <span className="ml-1 text-muted-foreground">×{t.mentions}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.objections?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">Objeções</p>
            <ObjectionsList objections={data.objections} />
          </div>
        )}

        {data.key_moments?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">Momentos críticos</p>
            <KeyMomentsTimeline moments={data.key_moments} />
          </div>
        )}

        {data.coaching_tips?.length > 0 && (
          <div className="rounded border border-primary/20 bg-primary/5 p-2">
            <p className="text-[10px] font-semibold text-primary mb-1 flex items-center gap-1">
              <Target className="h-3 w-3" /> Coaching Tips
            </p>
            <ul className="space-y-0.5">
              {data.coaching_tips.map((t, i) => (
                <li key={i} className="text-xs text-foreground">• {t}</li>
              ))}
            </ul>
          </div>
        )}

        {data.next_best_action && (
          <p className="text-xs text-foreground border-l-2 border-primary pl-2 italic">
            <span className="font-semibold">Próxima melhor ação:</span> {data.next_best_action}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
