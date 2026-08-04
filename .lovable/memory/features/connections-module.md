---
name: Connections Module
description: Módulo /admin/conexoes para gerenciar integrações externas (Supabase, Bitrix24, n8n, MCP Claude) + webhooks entrantes para outros sistemas Lovable.
type: feature
---

## Tabelas
- `connection_configs` — credenciais por tipo (`supabase_external`/`bitrix24`/`n8n`/`mcp_claude`/`custom`), config JSONB, status do último teste. RLS apenas admin.
- `connection_test_logs` — histórico de testes (latência, status, mensagem).
- `incoming_webhooks` — webhooks públicos com token único, target_entity, allowed_origins, field_mapping JSON.
- `incoming_webhook_logs` — log de cada chamada recebida (payload, IP, status).

## Edge Functions
- `connection-tester` — testa conexões por tipo (autenticado, JWT em código). Atualiza `last_test_*` e grava log.
- `incoming-webhook` — endpoint público `/incoming-webhook/<token>`, valida origem, mapeia payload e insere na entidade alvo.
- `mcp-server` — servidor MCP JSON-RPC (Streamable HTTP) para Claude Desktop. Auth via header `X-MCP-Token` que casa com `connection_configs.config->>token`. Tools: `search_contacts`, `search_companies`, `list_deals`.

## UI
- Página `/admin/conexoes` com 5 abas: Supabase, Bitrix24, n8n, MCP Claude, Webhooks Entrantes.
- `ConnectionFormDialog` com campos dinâmicos por tipo, botão Testar antes de Salvar.
- `ConnectionCard` com toggle ativo/inativo, teste, edit, remoção.
- `IncomingWebhookCard` com URL pública copiável, contador de chamadas/erros, rotação de token, logs.
- `McpInstructionsCard` com snippet pronto para `claude_desktop_config.json`.

## Hooks
- `useConnections` — CRUD + test + toggleActive (TanStack Query).
- `useIncomingWebhooks` — CRUD + rotateToken; `useIncomingWebhookLogs` para detalhe.

## Roteamento
- Link no `AdminSidebar` (segunda posição) e card no `AdminDashboard`.
- Protegido por `RequireAdminLazy`.
