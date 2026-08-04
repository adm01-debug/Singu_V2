# ADR-013: Hardening do Módulo de Conexões (Rodada J)

**Status:** Aceita
**Data:** 2026-04-20
**Decisores:** Equipe de Engenharia

## Contexto

O módulo de Conexões introduzido na rodada anterior (`/admin/conexoes`) expôs três
endpoints públicos (`incoming-webhook`, `mcp-server`, `connection-tester`) e
armazenou tokens de terceiros (Bitrix24, n8n, Supabase Service Role, MCP) em texto
puro nas colunas JSONB `config` / `secret_refs`. Era necessário endurecer o módulo
antes de declarar o sistema 50/50.

## Decisão

### 1. Rate limiting + validação Zod nos endpoints públicos
- `incoming-webhook`: **60 req/min por IP** + Zod `record(unknown)` com limite de 256KB.
- `mcp-server`: **120 req/min por token** + Zod para payload JSON-RPC 2.0
  (`initialize`, `tools/list`, `tools/call`, `ping`).
- Reuso do `_shared/rate-limit.ts` (sliding window in-memory).

### 2. Criptografia simétrica (AES via `pgcrypto`)
- Nova coluna `encrypted_config bytea` em `connection_configs`.
- Trigger `connection_configs_encrypt_trigger` cifra `config + secret_refs` em
  cada `INSERT/UPDATE` e mascara campos sensíveis (`token`, `api_key`, `secret`,
  `password`, `service_role_key`, `webhook_secret`) na coluna `config` em texto puro.
- Funções `encrypt_connection_config` / `decrypt_connection_config` SECURITY DEFINER,
  restritas a `app_role = 'admin'` via `has_role()`.
- Chave lida do GUC `app.connection_encryption_key`, com fallback determinístico
  para evitar lock-out (admin deve configurar via Vault em produção).

### 3. Health check integrado
- `health-aggregate` v3.1.0 inclui bloco `connections: { total, active, test_failures_24h, webhook_errors_24h }`.
- Status `degraded` quando >10 falhas de teste ou >20 erros de webhook em 24h.

### 4. Logs unificados
- Nova rota `/admin/conexoes/logs` mescla `connection_test_logs` e
  `incoming_webhook_logs` cronologicamente.
- Filtros por origem (todos / conexões / webhooks), status, período (24h/7d/30d) e busca textual.
- Sheet lateral exibe payload, resposta e detalhes em JSON expandido.

### 5. Documentação
- ADR-013 (este arquivo), CHANGELOG v2.2.0, memória `mem://features/ux-rodada-j-connections-hardening`.

## Consequências

- **Positivo:** Tokens de terceiros nunca trafegam em texto puro em backups/queries.
- **Positivo:** Endpoints públicos protegidos contra brute force e payload bomb.
- **Positivo:** Visibilidade operacional unificada acelera diagnóstico.
- **Negativo:** Rate limit in-memory reseta em cold start (aceitável para escala atual,
  alinhado com ADR-009).
- **Negativo:** A descriptografia depende de `has_role(admin)` — service role bypassa
  via `_connection_encryption_key()` em edge functions.
