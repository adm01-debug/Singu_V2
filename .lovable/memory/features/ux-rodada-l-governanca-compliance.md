---
name: UX Rodada L — Governança & Compliance
description: Rodada L — Auditoria automática de connection_configs/incoming_webhooks com mascaramento de segredos, HMAC SHA-256 + anti-replay, quotas mensais por webhook (429), modo dry-run/replay nos logs.
type: feature
---

## Entregas (60/60)
1. **Auditoria DB** — trigger `audit_connection_changes()` em `connection_configs` e `incoming_webhooks` grava em `audit_log` com `config`, `webhook_secret`, `token` e `encrypted_config` mascarados.
2. **HMAC + anti-replay** — `incoming-webhook` valida `X-Lovable-Signature` (sha256 sobre `${ts}.${rawBody}`) com `X-Lovable-Timestamp` dentro de `replay_window_seconds` (default 300s).
3. **Quotas** — tabela `connection_quotas` (mensal), RPC `increment_webhook_quota` chamada pelo edge; retorna 429 quando `calls_used > calls_limit AND overage_blocked`.
4. **Dry-run + Replay** — `?dry_run=true` valida mapeamento sem persistir, sem incrementar quota nem total_calls; botão `WebhookReplayButton` em `IncomingWebhookLogsDialog` permite ambos.
5. **UI** — `WebhookQuotaBar` (Progress) no `IncomingWebhookCard`, badge HMAC, campos no `IncomingWebhookFormDialog`.

## Constantes
- Janela anti-replay default: 300s.
- Limite mensal default: 10000 chamadas por webhook.
- Mascaramento: `config`, `encrypted_config`, `webhook_secret`, `token`.

## SLO
- 99.5% sucesso em webhooks ativos (mantido da Rodada K).
- 100% das mudanças em conexões/webhooks rastreadas em `audit_log`.
