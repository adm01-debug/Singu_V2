---
name: Completion 32/10 — Onda F Backend Linter Baseline
description: Rodada 32/10 reduziu backend linter Supabase de 109 → 46 WARN (-58%) via REVOKE EXECUTE em 7 funções anon + 33 triggers + 23 internas. ADR-022 formaliza ratchet.
type: reference
---

# Rodada 32/10 — Onda F: Backend Linter Baseline Reduction

## Resultado

- **109 → 46 WARN** (−58%), 0 CRITICAL, 0 HIGH.
- Zero regressão funcional: todos os 46 RPCs consumidos pelo client mantiveram grant.

## Ações

1. **REVOKE FROM anon (7):** funções internas do pipeline comportamental
   (`check_behavioral_regen_cron_staleness`, `cleanup_behavioral_regen_queue`,
   `cleanup_simulated_alerts`, `enqueue_behavioral_profile_regen`,
   `get_behavioral_regen_cron_health`, `notify_admins_on_critical_behavioral_alert`,
   `simulate_behavioral_regen_alert`).
2. **REVOKE FROM authenticated — triggers (33):** todos `audit_*`, `process_*_audit`,
   `notify_*`, `log_*`, `sync_*`, `enqueue_*` etc. Triggers disparam via table owner.
3. **REVOKE FROM authenticated — internos (23):** `_connection_encryption_key`,
   `encrypt/decrypt_connection_config`, `enqueue_smart_notification`, `search_*_semantic`,
   `seed_deal_room`, `seed_playbook_defaults`, `seed_win_loss_defaults`,
   `move_deal` (legado), `update_deal_amount`, `get_team_member_ids` etc.
4. **Mantidos (46):** 9 endpoints públicos anon + 34 RPCs autenticados listados
   em `linter-baseline.md`.

## Artefatos

- `docs/adr/ADR-022-backend-linter-baseline-ratchet.md`
- `scripts/check-backend-linter-baseline.mjs`
- `.lovable/memory/architecture/security/linter-baseline.md` (atualizado, 46 entradas)
- `docs/qa/CERTIFICATION_10_10.md`, `docs/qa/findings.md` (item #5 fechado)

## Dívida futura

- Bucket B (DEFINER → INVOKER): candidatas `search_*_unaccent`, `seed_*_defaults`.
  Requer testes RLS por função.
