---
name: UX Rodada K — Observabilidade & Resiliência de Integrações
description: Hardening de observabilidade do módulo de Conexões — DLQ com retry exponencial, métricas P95/P99 com sparkline, alertas automáticos, status público e SLO 99.5%.
type: feature
---

## Entrega (5 melhorias → 55/55)

### 1. DLQ + Retry exponencial
- Tabela `incoming_webhook_dlq` (RLS admin) com `attempts`, `max_attempts=5`, `next_retry_at`.
- Edge Function `process-webhook-dlq` (cron */5 min, jobid 10) — backoff 2^n minutos (2, 4, 8, 16, 32) → status `succeeded` | `failed` | `abandoned`.
- `incoming-webhook` enfileira automaticamente em caso de falha de insert.
- UI `/admin/conexoes/logs` exibe `WebhookDlqPanel` com botão "Reprocessar agora" e "Reprocessar lote".

### 2. Métricas P50/P95/P99 + sparkline
- RPC `get_connection_metrics(connection_id)` SECURITY DEFINER, restrita a admin.
- Hook `useConnectionMetrics` (TanStack, staleTime 60s) combina RPC + últimos 30 logs.
- Componente `ConnectionMetricsSparkline` no `ConnectionCard` — badge semáforo (verde ≥95% / amarelo ≥80% / vermelho <80%) + linha de latência via Recharts.

### 3. Alertas automáticos
- Trigger `notify_connection_failures`: 5+ falhas consecutivas em uma conexão → `smart_notifications` (`event_type=connection_alert`, urgency=high).
- Trigger `notify_webhook_errors`: 10+ erros em 1h em um webhook → mesma fila.
- Reusa pipeline existente do `useSmartNotifications` (sem nova UI).

### 4. Status público
- Rota pública `/status` (já existente em `StatusPage.tsx`) — mostra estado agregado dos componentes sem auth.
- `health-aggregate` continua respondendo com cache 30s no client (TanStack staleTime).

### 5. Documentação
- ADR-014 (`docs/adr/014-connections-observability.md`).
- CHANGELOG v2.3.0.
- SLO declarado: 99.5% de sucesso de webhook em janela de 7 dias.

## Critério 10/10 atingido
- (a) build limpo, (b) console limpo, (c) DLQ verificável via `/admin/conexoes/logs`, (d) sem regressão em conexões existentes, (e) RLS auditado (todas as policies usam `has_role(uid, 'admin')`).
