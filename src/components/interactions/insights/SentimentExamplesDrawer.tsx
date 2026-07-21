import { memo, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SentimentOverall } from "@/hooks/useConversationIntel";

interface Props {
  bucket: SentimentOverall | null;
  interactionIds: string[];
  onClose: () => void;
}

interface Example {
  id: string;
  title: string | null;
  type: string | null;
  created_at: string | null;
  content: string | null;
  contact_id: string | null;
  sentiment: string | null;
}

const LABELS: Record<SentimentOverall, string> = {
  positive: "Positivo",
  neutral: "Neutro",
  negative: "Negativo",
  mixed: "Misto",
};

const BADGE_VARIANTS: Record<SentimentOverall, "default" | "secondary" | "destructive" | "outline"> = {
  positive: "default",
  neutral: "secondary",
  negative: "destructive",
  mixed: "outline",
};

const MAX_EXAMPLES = 20;

function SentimentExamplesDrawerImpl({ bucket, interactionIds, onClose }: Props) {
  const totalCount = Array.isArray(interactionIds) ? interactionIds.length : 0;
  const limitedIds = useMemo(
    () => (Array.isArray(interactionIds) ? interactionIds : []).slice(0, MAX_EXAMPLES),
    [interactionIds]
  );
  const idsKey = limitedIds.join(",");

  // TanStack Query: cache 5min por (bucket, idsKey). Evita refetch ao reabrir o mesmo recorte.
  const { data: examples = [], isLoading } = useQuery({
    queryKey: ["sentiment-examples", bucket, idsKey],
    enabled: !!bucket && limitedIds.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Example[]> => {
      const { data, error } = await supabase
        .from("interactions")
        .select("id, title, type, created_at, content, contact_id, sentiment")
        .in("id", limitedIds)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return Array.isArray(data) ? (data as Example[]) : [];
    },
  });

  return (
    <Sheet open={!!bucket} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            Conversas com sentimento
            {bucket && <Badge variant={BADGE_VARIANTS[bucket]} className="text-[10px]">{LABELS[bucket]}</Badge>}
          </SheetTitle>
          <SheetDescription>
            {bucket ? `${totalCount} ${totalCount === 1 ? "conversa" : "conversas"} no período` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-md border border-border/60 bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-11/12" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              ))}
            </>
          )}
          {!isLoading && examples.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum exemplo disponível.</p>
          )}
          {!isLoading && examples.map((ex) => (
            <article key={ex.id} className="rounded-md border border-border/60 bg-card p-3 space-y-2">
              <header className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-foreground truncate">{ex.title ?? "Sem título"}</h4>
                {ex.sentiment && (
                  <Badge variant="outline" className="text-[10px] capitalize">{ex.sentiment}</Badge>
                )}
              </header>
              {ex.content && (
                <p className="text-xs text-muted-foreground line-clamp-3">{ex.content}</p>
              )}
              <footer className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">
                  {ex.type} · {ex.created_at ? new Date(ex.created_at).toLocaleDateString("pt-BR") : ""}
                </span>
                {ex.contact_id && (
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1">
                    <Link to={`/contatos/${ex.contact_id}/ficha-360`} onClick={onClose}>
                      Ficha 360 <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </footer>
            </article>
          ))}
          {!isLoading && totalCount > MAX_EXAMPLES && (
            <p className="text-[11px] text-muted-foreground text-center pt-2">
              Mostrando {MAX_EXAMPLES} de {totalCount} conversas
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const SentimentExamplesDrawer = memo(SentimentExamplesDrawerImpl);
