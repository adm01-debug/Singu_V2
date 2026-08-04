---
name: Rodada M — Federação, Schema Discovery & DX
description: Schema discovery automático em Supabases externos, templates de webhook por origem, snippets cURL/JS/Python/n8n/Bitrix, MCP server expandido com 5 novas tools. Marco 65/65.
type: feature
---

## Schema Discovery
- Edge function `connection-introspect` valida JWT admin, lê `connection_configs.config.url + service_role_key`, consulta `information_schema.tables/columns` (max 50 tabelas, 80 colunas/tabela) e persiste em `connection_configs.discovered_schema` + `discovered_at`.
- UI `SchemaDiscoveryCard` mostra árvore expansível (`Collapsible` + `ScrollArea`) com tipo e nullability por coluna.
- Rate limit: 10 req/min por IP.

## Webhook Templates
- Biblioteca `WEBHOOK_TEMPLATES` com 5 presets: Bitrix24 (ONCRMLEADADD), n8n genérico, Stripe customer.created, GitHub issues.opened, Lovable form.
- Cada template define `target_entity`, `field_mapping` e `example_payload`.
- Aplicação 1-clique no `IncomingWebhookFormDialog` via Select.

## Playground (cURL/Snippets)
- `WebhookSnippetsSheet` reusa `Sheet` + `CodeExample` para renderizar snippets prontos com URL real, headers HMAC condicionais e payload baseado no mapping.
- 5 snippets: cURL, fetch JS, Python requests, n8n HTTP node, Bitrix24 outbound.

## MCP Server v1.2.0
- Tools adicionadas: `create_contact`, `update_deal_stage`, `add_interaction`, `search_companies_by_intent`, `get_pipeline_summary`.
- Cada chamada loga em `mcp_tool_calls` (connection_id, tool_name, status, latency_ms).
- Validação Zod por tool, RLS admin-read na tabela.

## Tabelas/colunas novas
- `connection_configs.discovered_schema jsonb` + `discovered_at timestamptz`.
- `mcp_tool_calls (id, connection_id, tool_name, arguments_summary, status, error_message, latency_ms, created_at)` com RLS admin-read.
