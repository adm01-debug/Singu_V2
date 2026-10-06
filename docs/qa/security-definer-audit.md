# Auditoria SECURITY DEFINER — Rodada 49/10

> Objetivo: confirmar que **toda** função `SECURITY DEFINER` em `public.*` (a) trava `search_path`; e que nenhum DEFINER **exposto a `anon`** lê `auth.uid()` — combinação perigosa: `anon` sem JWT resulta em `auth.uid() = NULL` e o DEFINER escreve linhas órfãs ou cross-tenant.

## Baseline atual — 96 DEFINERs (banco canônico `pgxfvjmuubtbowutlide`, 2026-10-06)

Medido no banco canônico com as migrations `20261006120000` e `20261006120100` aplicadas em transação revertida (`tests/rls/run.sh`).
O baseline anterior (63) refletia o histórico local de migrations, não o banco real (93 DEFINERs antes desta rodada; +3 RPCs públicas novas).

- **Total DEFINER em `public.*`**: 96
- **Executáveis por `anon`**: 12 — exatamente a allowlist pública de `tests/rls/functions_authenticated_allowlist.sql` (Deal Room ×5, Forms ×2, Lead Magnets ×2, Landing Page ×1, CSAT ×2); nenhuma usa `auth.uid()`.
- **Executável só por `authenticated` (além de service_role)**: 1 — `has_role(uuid, app_role)`.
- **Somente `service_role`/owner**: 83 (triggers, jobs, RPCs administrativas). 22 delas usam `auth.uid()`.
- **DEFINERs sem `search_path` travado**: **0** ✅

### Achado aberto — RPCs chamadas pelo frontend sem `EXECUTE` para `authenticated`

Já antes desta rodada, estas DEFINERs eram chamadas com sessão de usuário em `src/` mas só `service_role` as executa (resultado: `42501` no app):
`cleanup_behavioral_regen_queue`, `compute_account_health`, `compute_attribution`, `compute_revops_kpis`, `cs_renewal_pipeline`,
`dismiss_revops_alert`, `enroll_contact_in_workflow`, `evaluate_mql`, `get_connection_metrics`, `get_marketing_funnel_stats`,
`get_score_explicability`, `move_deal_atomic`, `publish_mtta_sla_breach_alert`, `seed_conversation_topics`, `seed_forecast_period`.
Conceder `EXECUTE` exige revisar cada corpo (várias recebem `_user_id` como parâmetro e seriam cross-tenant sem `auth.uid() = _user_id`); tratado em PR próprio.

## DEFINERs expostos a `anon` — inspeção manual detalhada (5 críticos)

| Função | search_path travado | Usa `auth.uid()`? | Fonte de identidade | Status |
|---|---|---|---|---|
| `buyer_add_comment(text, text, text)` | ✅ `public, pg_temp` | ❌ | `share_token` + `deal_rooms.user_id` | OK |
| `buyer_toggle_milestone(text, uuid, boolean, text)` | ✅ `public, pg_temp` | ❌ | `share_token` + `deal_rooms.user_id` | OK |
| `has_role(uuid, app_role)` | ✅ `public, pg_temp` | ❌ | `_user_id` parâmetro explícito | OK |
| `submit_public_form(text, jsonb, jsonb, text, text)` | ✅ `public, pg_temp` | ❌ | `slug` + `forms.user_id` | OK |
| `track_magnet_download(text, text, text, jsonb)` | ✅ `public, pg_temp` | ❌ | `slug` + `lead_magnets.user_id` | OK |

**Resultado**: nenhuma anomalia. Todas as funções expostas a `anon` derivam ownership do recurso público (token/slug) ou de parâmetro explícito, nunca de `auth.uid()` dentro do corpo DEFINER — padrão correto.

> Os 58 DEFINERs restantes são acessíveis apenas por `service_role` (jobs, triggers, RPCs administrativas). Vários usam `auth.uid()` de forma legítima porque só rodam sob sessão autenticada válida, e todos têm `search_path` travado. Não são inspecionados um-a-um aqui — a invariante coletiva é validada por `tests/rls/security_definer_hardening.sql`.

## Invariantes

1. Todo DEFINER: `proconfig` contém `search_path=...` (pinned).
2. DEFINER com `EXECUTE` a `anon`: corpo (`prosrc`) **não** pode conter `auth.uid()`.
3. Novo DEFINER exige revisão manual, atualização deste doc e ajuste do baseline em `tests/rls/security_definer_hardening.sql`.

## Cenários de gap prevenidos

- ❌ DEFINER com `search_path` mutável → hijack via schema shadow (`pg_temp.deal_rooms`).
- ❌ DEFINER que lê `auth.uid()` e cai em NULL quando chamado por `anon` sem JWT → escreve linhas órfãs.
- ❌ DEFINER que insere sem validar ownership do token → escrita cross-tenant.
- ❌ Novo DEFINER adicionado sem revoke de `PUBLIC` → escalada silenciosa.