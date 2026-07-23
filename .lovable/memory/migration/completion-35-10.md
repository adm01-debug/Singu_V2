---
name: Rodada 35/10 — Onda G Bucket B (lote 3)
description: Conversão DEFINER→INVOKER de 3 funções de seed user-scoped; baseline linter 39→36 WARN.
type: feature
---
## Escopo
- `seed_lead_score_defaults(uuid)` — INVOKER + guard `auth.uid() = _user_id`.
- `seed_conversation_topics(uuid)` — INVOKER + guard.
- `seed_forecast_period(uuid, text)` — INVOKER + guard, corpo preservado.

## Impacto
- Baseline backend linter: **39 → 36 WARN**.
- `scripts/check-backend-linter-baseline.mjs` atualizado (`BASELINE = 36`).
- Nenhuma alteração de schema, dados ou contratos de API.

## Riscos mitigados
- Se algum caller invocasse essas RPCs com `_user_id` divergente do JWT, agora recebe `42501` explicitamente em vez de gravar em outra conta.
- RLS das tabelas de destino passa a valer para o caller — defesa em profundidade além do guard.