import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { SCENARIO_LABELS, type SalesPlaybook } from "@/hooks/usePlaybooks";

interface Props {
  playbook: SalesPlaybook;
  matchScore?: number;
  reasons?: string[];
}

export function PlaybookCard({ playbook, matchScore, reasons }: Props) {
  return (
    <Card variant="interactive" className="h-full">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <BookOpen className="size-4" />
            </div>
            <Badge variant="secondary">{SCENARIO_LABELS[playbook.scenario]}</Badge>
          </div>
          {matchScore !== undefined && matchScore > 0 && (
            <Badge variant="default" className="gap-1"><Flame className="size-3" />{Math.round(matchScore)}</Badge>
          )}
        </div>
        <h3 className="text-base font-semibold leading-tight">{playbook.name}</h3>
        {playbook.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{playbook.description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {reasons && reasons.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {reasons.slice(0, 3).map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        )}
        <div className="flex flex-wrap gap-1">
          {playbook.tags.slice(0, 4).map((t) => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {playbook.content?.sections?.length || 0} seções · {playbook.usage_count} uso(s)
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/playbooks/${playbook.id}`}>Abrir <ChevronRight className="size-4" /></Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
