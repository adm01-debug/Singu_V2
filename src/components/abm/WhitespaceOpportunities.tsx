import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, ArrowUpRight, Repeat, Zap } from "lucide-react";
import { motion } from "framer-motion";
import {
  useWhitespaceOpportunities,
  useGenerateWhitespace,
  useUpdateWhitespaceStatus,
  type WhitespaceType,
} from "@/hooks/useABM";

const typeConfig: Record<WhitespaceType, { label: string; icon: typeof TrendingUp; tone: string }> = {
  cross_sell: { label: "Cross-Sell", icon: ArrowUpRight, tone: "bg-primary/15 text-primary border-primary/30" },
  up_sell: { label: "Up-Sell", icon: TrendingUp, tone: "bg-success/15 text-success border-success/30" },
  expansion: { label: "Expansão", icon: Zap, tone: "bg-accent/15 text-accent-foreground border-accent/30" },
  renewal: { label: "Renovação", icon: Repeat, tone: "bg-warning/15 text-warning border-warning/30" },
};

export function WhitespaceOpportunities({ accountId }: { accountId: string }) {
  const { data: opps = [], isLoading } = useWhitespaceOpportunities(accountId);
  const gen = useGenerateWhitespace();
  const updateStatus = useUpdateWhitespaceStatus();

  const totalValue = opps.reduce((s, o) => s + (o.estimated_value ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Whitespace identificado</h3>
          <p className="text-xs text-muted-foreground">
            {opps.length} oportunidade(s) · Valor potencial: R$ {totalValue.toLocaleString("pt-BR")}
          </p>
        </div>
        <Button size="sm" onClick={() => gen.mutate(accountId)} disabled={gen.isPending}>
          <Sparkles className="h-4 w-4 mr-1" />
          {gen.isPending ? "Analisando..." : "Gerar com IA"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : opps.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma oportunidade ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Use a IA para identificar whitespace nesta conta</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {opps.map((opp, i) => {
            const cfg = typeConfig[opp.opportunity_type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-sm truncate">{opp.product_category}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${cfg.tone}`}>{cfg.label}</Badge>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Valor estimado</span>
                      <span className="font-semibold">
                        R$ {(opp.estimated_value ?? 0).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Confiança</span>
                      <span className="font-semibold">{opp.confidence}%</span>
                    </div>

                    {opp.rationale && (
                      <p className="text-xs text-muted-foreground border-t pt-2 line-clamp-3">{opp.rationale}</p>
                    )}

                    <div className="flex gap-1.5">
                      <Button
                        size="sm" variant="outline" className="flex-1 text-xs"
                        onClick={() => updateStatus.mutate({ id: opp.id, status: "pursuing", account_id: accountId })}
                      >
                        Perseguir
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="flex-1 text-xs"
                        onClick={() => updateStatus.mutate({ id: opp.id, status: "dismissed", account_id: accountId })}
                      >
                        Descartar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
