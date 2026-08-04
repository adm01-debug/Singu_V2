---
name: Lux Intelligence Webhook Configuration
description: Sistema de configuração de webhooks n8n para Lux Intelligence com retry, timeout, fallback e admin UI em /admin/lux-config.
type: feature
---
- Tabela `lux_webhook_config` armazena URL, timeout, retries por entity_type (contact/company), RLS apenas admin
- Edge Function `lux-trigger` busca config da tabela → fallback para env `N8N_LUX_WEBHOOK_URL`
- Retry com backoff exponencial (até 3 tentativas), timeout configurável (default 60s)
- Se webhook não configurado, retorna `error: 'not_configured'` (HTTP 422)
- Se webhook falha após retries, record fica com status 'error' mas scan é criado
- Hook `useLuxWebhookConfig` para CRUD admin + teste de webhook
- Página `/admin/lux-config` com cards por entidade, toggle ativo/inativo, teste, histórico de execuções
- `useLuxIntelligence.triggerLux` trata 'not_configured' e 'webhookStatus: failed' com toasts informativos
