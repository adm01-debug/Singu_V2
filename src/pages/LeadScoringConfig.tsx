import { Helmet } from 'react-helmet-async';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { useScoreRules, useScoreThresholds } from '@/hooks/useLeadScoring';
import { ScoreRulesEditor } from '@/components/lead-scoring/ScoreRulesEditor';
import { ThresholdsEditor } from '@/components/lead-scoring/ThresholdsEditor';

export default function LeadScoringConfigPage() {
  const { data: rules = [] } = useScoreRules();
  const { data: thresholds = [] } = useScoreThresholds();

  return (
    <>
      <Helmet>
        <title>Configurar Lead Scoring | SINGU CRM</title>
        <meta name="description" content="Edite pesos por sinal, janelas de decay e thresholds de grade do Lead Scoring." />
      </Helmet>
      <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <SmartBackButton fallback="/lead-scoring" label="Voltar para Lead Scoring" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Configuração de Lead Scoring</h1>
          <p className="text-sm text-muted-foreground">Ajuste pesos, decay e faixas de grade. Mudanças aplicam-se no próximo recálculo.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ScoreRulesEditor rules={rules} />
          </div>
          <ThresholdsEditor thresholds={thresholds} />
        </div>
      </div>
    </>
  );
}
