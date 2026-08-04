# ADR-016 — Federação, Schema Discovery & Developer Experience (Rodada M)

**Status:** Aceito
**Data:** 2026-04-20
**Marco:** 65/65 melhorias

## Contexto
Após Rodada L (governança/HMAC/quotas), o módulo de Conexões precisava reduzir fricção de onboarding e ampliar o alcance do MCP server.

## Decisões

### 1. Schema Discovery via `information_schema`
Edge function dedicada (`connection-introspect`) com JWT admin obrigatório e rate limit (10/min). Leitura via `information_schema.tables/columns` no banco externo, persistência em coluna JSONB para evitar consultas repetidas. Limite de 50 tabelas × 80 colunas para conter payload.

### 2. Templates de Webhook
Biblioteca client-side estática (`WEBHOOK_TEMPLATES`) — preferida sobre tabela dinâmica para evitar overhead de admin. Curadoria manual garante qualidade dos mappings.

### 3. Snippets generators
`WebhookSnippetsSheet` renderiza 5 formatos com substituição de URL/payload em runtime. HMAC headers condicionais (`require_signature ? ... : ''`).

### 4. MCP server v1.2.0
5 novas tools com Zod schemas. Log obrigatório em `mcp_tool_calls` (status + latency) — viabiliza debugging e analytics futuros.

## Consequências
- **+** Onboarding de novo webhook: ~3min → ~30s.
- **+** MCP cobre fluxos write (não só read).
- **+** Schema introspectado vira fonte de verdade para futuros UI builders.
- **−** `discovered_schema` pode ficar stale; UI mostra timestamp + botão "Re-descobrir".

## Alternativas descartadas
- **Templates server-side**: rejeitado — versão estática client-side é suficiente e evita migração de dados.
- **GraphQL introspection**: rejeitado — Supabase externo nem sempre tem GraphQL habilitado.
