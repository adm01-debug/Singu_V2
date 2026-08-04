---
name: Detecção de Risco de Churn
description: Sistema local de análise de risco de churn baseado em inatividade, sentimento, relationship score e frequência de interação.
type: feature
---
- Tabela `churn_risk_scores` com RLS por user_id
- Edge Function `detect-churn-risk`: analisa 5 fatores (inatividade, sentimento negativo, score baixo, queda de frequência, sem histórico)
- Scores 0-100 com níveis low/medium/high/critical
- Recomendações automáticas de retenção personalizadas
- Hook `useLocalChurnRisks` + `useAnalyzeChurnRisk` (mutation)
- Componente `ChurnRiskPanel` com barra de risco, trends e recomendações
- Integrado na aba Inteligência do contato via lazy loading
- Complementa widgets externos existentes (ChurnRiskWidget, ChurnPredictionsWidget)
