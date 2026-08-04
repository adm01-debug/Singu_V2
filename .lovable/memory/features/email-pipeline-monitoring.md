---
name: Email Pipeline Monitoring
description: Edge Function + widget + página admin para monitorar saúde da pipeline de email (Google Workspace → Pub/Sub → Webhook)
type: feature
---

## Arquitetura

- **Edge Function** `email-pipeline-health`: consulta `email_logs` no banco externo via proxy `external-data`, retorna status (healthy/degraded/offline), último email e stats por vendedor.
- **Hook** `useEmailPipelineHealth`: React Query com staleTime 5min.
- **Widget** `EmailPipelineStatus.tsx`: card compacto para dashboards admin com status colorido + botão refresh.
- **Página** `/admin/email-diagnostics`: protegida por RequireAdmin, com cards de status, gráfico de volume por vendedor (Recharts BarChart), tabela detalhada e alertas de anomalias.

## Status

| Status | Condição |
|--------|----------|
| healthy | Último email < 1h |
| degraded | Último email < 24h |
| offline | Sem emails recentes |

## Anomalias Detectadas
- Vendedor com 0 emails nas últimas 24h → alerta vermelho
- Vendedor com < 3 emails → alerta amarelo
