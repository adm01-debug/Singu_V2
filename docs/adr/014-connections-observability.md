# ADR-014 — Connections Observability & Resilience

**Status:** Accepted · **Data:** 2026-04-20 · **Versão:** v2.3.0

## Contexto
A Rodada J entregou hardening de segurança do módulo de Conexões (criptografia, rate limit, validação Zod). Restavam três lacunas críticas de operação: (1) falhas de webhook eram apenas logadas, sem retry; (2) não havia métricas de latência percentilada por conexão; (3) administradores não recebiam alerta proativo quando uma integração começava a degradar.

## Decisão

### 1. Dead-Letter Queue com retry exponencial
- Falhas de insert no `incoming-webhook` são gravadas em `incoming_webhook_dlq`.
- Cron `process-webhook-dlq-every-5min` reprocessa entradas elegíveis (status=`pending` AND `next_retry_at <= now()`).
- Política de backoff: **2^n minutos** (2, 4, 8, 16, 32). Após `max_attempts=5` → status `failed`.
- Webhooks removidos/inativos durante a janela de retry → status `abandoned`.

### 2. Métricas percentiladas via RPC
- `get_connection_metrics(_connection_id UUID)` retorna p50/p95/p99/success_rate/total_calls/failures dos últimos 7 dias.
- `SECURITY DEFINER` + `has_role(auth.uid(), 'admin')` para evitar exposição de dados sensíveis.
- Renderizado inline no `ConnectionCard` via `ConnectionMetricsSparkline` (Recharts).

### 3. Alertas proativos via triggers DB
- 5+ falhas consecutivas em uma conexão → `smart_notifications` (urgency=high).
- 10+ erros de webhook em 1h → idem.
- Idempotência garantida pela condição `hourly_errors = 10` (dispara apenas no exato cruzamento do limite).

### 4. SLO formal
- **Target:** 99.5% de sucesso em webhooks (medido em janela de 7d via `success_rate`).
- **Threshold de saúde do card:** verde ≥95%, amarelo ≥80%, vermelho <80%.

## Consequências

### Positivas
- Falhas transitórias de rede/banco no destino não geram perda de dados.
- Operadores enxergam regressões de latência (sparkline) em segundos.
- Alertas chegam antes do usuário final perceber.

### Negativas
- DLQ pode acumular entradas se houver bug recorrente — mitigado por `max_attempts` e status `abandoned` em webhooks inativos.
- Triggers de alerta executam síncronos no INSERT — overhead avaliado <2ms por chamada.

## Verificação
1. Forçar falha de mapeamento → entrada aparece em `/admin/conexoes/logs` aba DLQ.
2. Aguardar 5 min → reprocessamento automático.
3. RPC: `select * from get_connection_metrics('<uuid>');` (apenas admin).
4. Inserir 5 logs com status='error' → `smart_notifications` recebe `connection_alert`.
