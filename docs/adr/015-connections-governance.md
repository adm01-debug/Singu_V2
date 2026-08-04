# ADR-015 — Connections Governance, HMAC e Quotas

**Status:** Aceito · **Data:** 2026-04-20 · **Versão:** v2.4.0

## Contexto
Após a Rodada K (observabilidade), o módulo de Conexões precisava de governança: rastreabilidade de mudanças, autenticidade dos payloads recebidos e controle de custo por integração.

## Decisão

### 1. Auditoria com mascaramento
Trigger `audit_connection_changes()` aplicado em `connection_configs` e `incoming_webhooks`. Registra `INSERT/UPDATE/DELETE` em `audit_log`, mascarando `config`, `encrypted_config`, `webhook_secret` e `token` para `***masked***` antes de persistir o diff. `auth.uid()` é capturado no trigger; em mutações server-to-server (sem JWT) caímos no `created_by`.

### 2. Assinatura HMAC SHA-256 + anti-replay
Quando `require_signature=true`, o `incoming-webhook` exige:
- `X-Lovable-Signature: sha256=<hex>` calculado como `HMAC_SHA256(webhook_secret, "${timestamp}.${rawBody}")`.
- `X-Lovable-Timestamp: <epoch_ms>` dentro de `replay_window_seconds` (default 300s).
Comparação em tempo constante (XOR + reduce). Falha → 401, sem incrementar quota.

### 3. Quotas mensais por webhook
Tabela `connection_quotas (webhook_id, period_start, calls_limit, calls_used, overage_blocked)` com `UNIQUE(webhook_id, period_start)`. RPC `increment_webhook_quota(webhook_id)` atomicamente upserta + incrementa + retorna `{ exceeded, overage_blocked }`. Se `exceeded && overage_blocked`, o edge retorna 429. Default: 10k chamadas/mês.

### 4. Dry-run e Replay
Query string `?dry_run=true` no edge:
- Pula incremento de quota e `total_calls`.
- Pula `INSERT` na entidade alvo.
- Retorna a `mapped_row` calculada para validação de `field_mapping`.
Replay real reusa o mesmo endpoint sem flag — útil para reprocessamento manual após correção humana (complementa DLQ automática da Rodada K).

## Política de retenção
- `incoming_webhook_logs`: 90 dias (a ser implementado via cron futura).
- `audit_log`: 12 meses (legal/LGPD).
- `connection_quotas`: 24 meses (faturamento histórico).

## SLA
- 100% das mudanças em conexões/webhooks rastreadas em `audit_log` (sem segredo vazado).
- 99.5% de sucesso para webhooks ativos com HMAC válido.
- 0 vazamento de secret em logs estruturados (mascaramento no trigger + nunca logamos `webhook_secret` no edge).

## Consequências
- **+** Conformidade LGPD por construção (auditoria + mascaramento).
- **+** Defesa em profundidade contra spoofing/replay.
- **+** Custo previsível por integração.
- **−** Origens existentes que não assinam payloads precisam migrar antes de habilitar `require_signature`.

## Referências
- Rodada K (ADR-014) — DLQ + métricas P95.
- `mem://features/ux-rodada-l-governanca-compliance.md`.
