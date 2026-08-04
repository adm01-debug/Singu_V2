---
name: Edge Functions Security Inventory
description: Inventário de hardening (rate limit, requestId, CORS, JWT) das edge functions críticas. external-data, ask-crm, meeting-summary auditadas na Rodada G.
type: feature
---

## Edge Functions Críticas — Status de Hardening

| Função            | Rate Limit             | requestId | JWT       | CORS    |
|-------------------|------------------------|-----------|-----------|---------|
| external-data     | ✓ 100/min/IP           | ✓         | withAuth  | shared  |
| ask-crm           | ✓ 20/min/IP            | (logs)    | withAuth  | scoped  |
| meeting-summary   | ✓ 10/min/IP (G)        | ✓ (G)     | getUser   | manual  |

## Padrão de hardening
1. `import { rateLimit } from "../_shared/rate-limit.ts";`
2. `const requestId = crypto.randomUUID();` no topo do handler.
3. Logs estruturados: `console.error(JSON.stringify({ requestId, level, fn, err }));`
4. CORS: usar `_shared/auth.ts` ou cabeçalhos manuais consistentes.

## Próximos candidatos
ai-writing-assistant, conversational-search, semantic-search, lead-scorer.
