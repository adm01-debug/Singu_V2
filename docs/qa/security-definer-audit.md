# Auditoria SECURITY DEFINER — Rodada 49/10

> Objetivo: confirmar que **toda** função `SECURITY DEFINER` em `public.*` (a) trava `search_path`; e que nenhum DEFINER **exposto a `anon`** lê `auth.uid()` — combinação perigosa: `anon` sem JWT resulta em `auth.uid() = NULL` e o DEFINER escreve linhas órfãs ou cross-tenant.

## Baseline atual — 109 DEFINERs (banco canônico `pgxfvjmuubtbowutlide` com migrations pendentes, 2026-10-13)

A migration `20261013033431_merge_records_atomically.sql` acrescenta uma RPC central DEFINER e transforma quatro aliases legados INVOKER em DEFINER, passando de 104 para 109. Esse total foi observado no gate de 2026-10-13, com a migration aplicada em transação revertida. A atualização do inventário foi autorizada pelo proprietário, preservando os controles de acesso anônimo, `search_path` e isolamento. A aplicação permanente continua pendente.

| Função | Escopo e proteção |
|---|---|
| `merge_records_atomically(text, uuid, uuid, jsonb)` | `auth.role() = 'authenticated'`, `auth.uid()` presente, ambos os registros do dono, relações com dono verificável, overrides limitados, locks ordenados, auditoria e dados na mesma transação |
| `merge_companies(uuid, uuid)` | Alias; delega à RPC central sem contornar a validação |
| `merge_duplicate_companies(uuid, uuid)` | Alias; delega à RPC central sem contornar a validação |
| `merge_contacts(uuid, uuid)` | Alias; delega à RPC central sem contornar a validação |
| `merge_duplicate_contacts(uuid, uuid)` | Alias; delega à RPC central sem contornar a validação |

As cinco funções fixam `search_path = public, pg_temp`, revogam EXECUTE de PUBLIC, anon e service_role e concedem EXECUTE apenas a authenticated. A prova `merge_records_atomic.sql` passou com rollback, cobrindo isolamento, aliases, conflitos, repetição e falha de auditoria. A lista pública não muda. As verificações de função extra, grant ausente, `search_path` e exposição insegura a anon permanecem integrais.

### Baseline anterior — 104 DEFINERs

Medido no banco canônico com as migrations pendentes até `20261011140000` aplicadas em transação revertida (`tests/rls/run.sh`).
O baseline anterior (63) refletia o histórico local de migrations, não o banco real (93 DEFINERs antes desta rodada; +3 RPCs públicas novas).

As RPCs transacionais `persist_company_composite`, `persist_lead_score_results` e `enroll_sequence_contact` usam `SECURITY INVOKER`: as permissões canônicas já permitem as gravações necessárias. Empresas e inscrições obedecem à RLS do chamador, além da validação explícita do dono; pontuações exigem `service_role` e validam o tenant de cada contato. As fixtures de atomicidade, retry, bloqueio entre usuários e as duas allowlists foram executadas com as migrations pendentes em transação revertida. Não foi necessário ampliar a allowlist nem o baseline de DEFINERs.

- **Total DEFINER em `public.*`**: 104 (`20261006130000` remove o overload quebrado `move_deal_atomic(uuid, text, numeric)`; `20261006140000` adiciona 8 do AI Gateway; `20261007100000` passa `get_instant_kpis(uuid)` a INVOKER; `20261011140000` restringe o gatilho de histórico de relacionamento a `service_role`/owner; `20261012223000` adiciona a confirmação manual de sequência)
- **Executáveis por `anon`**: 12 — exatamente a allowlist pública de `tests/rls/functions_authenticated_allowlist.sql` (Deal Room ×5, Forms ×2, Lead Magnets ×2, Landing Page ×1, CSAT ×2); nenhuma usa `auth.uid()`.
- **Executáveis por `authenticated`**: 19 — `has_role(uuid, app_role)` + as 15 RPCs do frontend abaixo + `get_ai_gateway_health(integer)` e `get_ai_gateway_partition_stats()` (painel admin; ambas exigem `has_role(auth.uid(), 'admin')`) + `confirm_sequence_manual_step(uuid, uuid, text)` (somente usuário autenticado, exige ownership de inscrição, sequência, etapa e contato; bloqueia a inscrição e confirma evento e avanço atomicamente).
- **Somente `service_role`/owner**: 73 (triggers, jobs, RPCs administrativas; inclui os 6 jobs/helpers do AI Gateway de `20261006140000`).
- **DEFINERs sem `search_path` travado**: **0** ✅

### RPCs do frontend com sessão de usuário — resolvido em `20261006130000`

Estas DEFINERs eram chamadas com sessão de usuário em `src/` mas só `service_role` as executava (`42501` no app). Cada corpo foi revisado antes do `GRANT EXECUTE ... TO authenticated`:

| Função | Escopo do chamador | Correção além do GRANT |
|---|---|---|
| `cleanup_behavioral_regen_queue` | exige admin | `search_path` com `pg_temp` |
| `publish_mtta_sla_breach_alert` | no-op sem admin | `search_path` com `pg_temp` |
| `get_connection_metrics` | exige admin | — |
| `compute_account_health`, `cs_renewal_pipeline` | `auth.uid()` = dono | — |
| `compute_attribution`, `dismiss_revops_alert` | filtram por `auth.uid()` | — |
| `compute_revops_kpis` | `auth.uid() = _user_id` | lia `deal_forecasts.amount` (inexistente) → `forecasted_amount` |
| `evaluate_mql` | contato de `auth.uid()` | lia `contacts.lead_score` (inexistente) → `lead_scores.total_score` |
| `enroll_contact_in_workflow` | workflow e contato de `auth.uid()` | gravava `enrolled_count` (inexistente) → `total_enrolled`, só na primeira inscrição |
| `get_marketing_funnel_stats` | `auth.uid() = _user_id` | lia `marketing_forms` (inexistente) → `forms`; período inclui o último dia |
| `get_score_explicability` | contato de `auth.uid()` | — |
| `move_deal_atomic(uuid, text, integer)` | deal de `auth.uid()` | overload `numeric` removido (lia `is_allowed`, inexistente) |
| `seed_conversation_topics`, `seed_forecast_period` | `auth.uid() = _user_id` | — |

O gatilho `log_deal_status_change` também foi corrigido: gravava `interactions` só com `company_id` e violava `chk_interaction_target` ao mover deal sem empresa.
Contrato verificado por `tests/rls/frontend_rpcs_authenticated.sql` (dono executa as 15; outro usuário é recusado; `anon` não executa).

## DEFINERs expostos a `anon` — inspeção manual detalhada (4 críticos)

| Função | search_path travado | Usa `auth.uid()`? | Fonte de identidade | Status |
|---|---|---|---|---|
| `buyer_add_comment(text, text, text)` | ✅ `public, pg_temp` | ❌ | `share_token` + `deal_rooms.user_id` | OK |
| `buyer_toggle_milestone(text, uuid, boolean, text)` | ✅ `public, pg_temp` | ❌ | `share_token` + `deal_rooms.user_id` | OK |
| `submit_public_form(text, jsonb, jsonb, text, text)` | ✅ `public, pg_temp` | ❌ | `slug` + `forms.user_id` | OK |
| `track_magnet_download(text, text, text, jsonb)` | ✅ `public, pg_temp` | ❌ | `slug` + `lead_magnets.user_id` | OK |

**Resultado**: nenhuma anomalia. Todas as funções expostas a `anon` derivam ownership do recurso público (token/slug) ou de parâmetro explícito, nunca de `auth.uid()` dentro do corpo DEFINER — padrão correto.

> Os DEFINERs restantes são acessíveis apenas por `service_role` (jobs, triggers, RPCs administrativas). Vários usam `auth.uid()` de forma legítima porque só rodam sob sessão autenticada válida, e todos têm `search_path` travado. Não são inspecionados um-a-um aqui — a invariante coletiva é validada por `tests/rls/security_definer_hardening.sql`.

## Invariantes

1. Todo DEFINER: `proconfig` contém `search_path=...` (pinned).
2. DEFINER com `EXECUTE` a `anon`: corpo (`prosrc`) **não** pode conter `auth.uid()`.
3. Novo DEFINER exige revisão manual, atualização deste doc e ajuste do baseline em `tests/rls/security_definer_hardening.sql`.

## Cenários de gap prevenidos

- ❌ DEFINER com `search_path` mutável → hijack via schema shadow (`pg_temp.deal_rooms`).
- ❌ DEFINER que lê `auth.uid()` e cai em NULL quando chamado por `anon` sem JWT → escreve linhas órfãs.
- ❌ DEFINER que insere sem validar ownership do token → escrita cross-tenant.
- ❌ Novo DEFINER adicionado sem revoke de `PUBLIC` → escalada silenciosa.