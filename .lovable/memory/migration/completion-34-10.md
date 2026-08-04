# Rodada 34/10 — Onda G Bucket B (lote 2)

Convertidas 3 funções DEFINER → INVOKER:
- `get_score_explicability(contact_id)` — explicabilidade de score.
- `cs_renewal_pipeline(user_id, days_ahead)` — pipeline de renovações CS (com cross-check `auth.uid()`).
- `get_marketing_funnel_stats(user_id, start, end)` — funil de marketing (com cross-check `auth.uid()` adicionado).

Baseline do backend linter: **42 → 39 WARN** (−3). `scripts/check-backend-linter-baseline.mjs` e `linter-baseline.md` atualizados para o novo teto.

Zero regressão funcional: as tabelas envolvidas (`contacts`, `interactions`, `cs_renewals`, `cs_accounts`, `lead_magnets`, `form_submissions`, `marketing_forms`, `mql_classifications`) já possuem RLS por `user_id`/`contact_id`, então o comportamento visível para o usuário permanece idêntico — o acesso passa a ser garantido pela RLS do caller em vez de bypass DEFINER.