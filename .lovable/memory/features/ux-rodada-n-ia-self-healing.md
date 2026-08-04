---
name: UX Rodada N — IA & Self-Healing
description: Auto-mapeamento de webhooks via IA, detecção de anomalias diária e self-healing por schema drift com human-in-the-loop.
type: feature
---

## Capacidades

- **Auto-mapeamento IA** (`ai-suggest-mapping`): no `IncomingWebhookFormDialog`, admin cola payload de exemplo → IA sugere `field_mapping` com confiança 0-1. Fallback determinístico (match por nome).
- **Detecção de anomalias** (`connection-anomaly-detector`): agrega logs últimos 7d, detecta picos/degradação. Resultados em `connection_anomalies` (RLS admin). Widget `AnomaliesWidget` na página `/admin/conexoes/logs`.
- **Self-healing**: `incoming-webhook` em erro de schema dispara `ai-suggest-mapping` em background → cria `smart_notification` com canal `mapping_drift` (confiança ≥ 0.8). Admin aceita manualmente.
- **Chat sobre conexões**: `ask-crm` com whitelist de tabelas de integrações; exige papel `admin` para queries em `connection_*`.

## Contratos IA

- Modelo padrão: `google/gemini-2.5-flash`
- Sempre fallback determinístico
- Confiança ≥ 0.8 para sugestões automáticas
- Tabela `connection_anomalies` armazena `model_used` e `confidence`

## Hooks/Componentes

- `useConnectionAnomalies` (TanStack Query): list + acknowledge + triggerScan
- `AnomaliesWidget`: severidade visual + botão "Reconhecer"
