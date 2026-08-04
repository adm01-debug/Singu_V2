import { Lightbulb } from 'lucide-react';
import { SectionFrame } from './SectionFrame';
import { IntelBadge } from './IntelBadge';
import { IntelEmptyState } from './IntelEmptyState';
import type { CrossRefInsight } from '@/lib/crossRefInsights';

interface CrossRefInsightsPanelProps {
  insights: CrossRefInsight[];
}

const SEV_LABEL: Record<CrossRefInsight['severity'], string> = {
  ok: 'POSITIVO',
  info: 'OBSERVAÇÃO',
  warn: 'ATENÇÃO',
};

/**
 * Painel de insights heurísticos sobre o cruzamento de entidades no CrossRef.
 * Sem LLM — apenas regras locais.
 */
export const CrossRefInsightsPanel = ({ insights }: CrossRefInsightsPanelProps) => {
  return (
    <SectionFrame title="INSIGHTS" meta={`${insights.length} OBS`}>
      {insights.length === 0 ? (
        <IntelEmptyState
          icon={Lightbulb}
          title="NO_INSIGHTS"
          description="Sem padrões fortes detectados ainda. Adicione mais entidades ou amplie o período."
        />
      ) : (
        <ul className="space-y-1.5" aria-label="Insights gerados">
          {insights.map((i) => (
            <li
              key={i.id}
              className="intel-card px-2 py-1.5 text-xs flex items-start gap-2"
            >
              <Lightbulb
                className="h-3 w-3 text-[hsl(var(--intel-accent))] shrink-0 mt-0.5"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <IntelBadge severity={i.severity}>{SEV_LABEL[i.severity]}</IntelBadge>
                <p className="text-foreground mt-1 leading-snug">{i.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionFrame>
  );
};
