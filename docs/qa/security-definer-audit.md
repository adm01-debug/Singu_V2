# Auditoria SECURITY DEFINER — Rodada 01/11

> Objetivo: confirmar que **toda** função `SECURITY DEFINER` em `public.*` (a) trava `search_path`; e que nenhum DEFINER **exposto a `anon`** lê `auth.uid()` — combinação perigosa: `anon` sem JWT resulta em `auth.uid() = NULL` e o DEFINER escreve linhas órfãs ou cross-tenant.

## Baseline atual — 116 DEFINERs (banco canônico `pgxfvjmuubtbowutlide`, 2026-11-24)

Total verificado no gate de 2026-11-24: **116 DEFINERs**. O delta de +5 sobre a rodada de 2026-11-18
são os stubs legados de ciclo de vida do cliente, todos `SECURITY DEFINER` com `search_path` travado e
`EXECUTE` **revogado de `anon`** (migration `20261121154000_revoke_anon_exec_stubs_crm.sql`) e mantido
para `authenticated` porque o fluxo legado de ERP/CRM ainda os chama:

| Função | Situação |
|---|---|
| `ativar_cliente(uuid, integer, text)` | `anon` revogado; `authenticated` com EXECUTE |
| `inativar_cliente(uuid, text, integer, text)` | `anon` revogado; `authenticated` com EXECUTE |
| `registrar_compra(uuid, numeric, text, text)` | `anon` revogado; `authenticated` com EXECUTE |
| `sdr_qualificar_cliente(uuid, integer, integer, text, text)` | `anon` revogado; `authenticated` com EXECUTE |
| `transferir_cliente(uuid, integer, text, integer, text)` | `anon` revogado; `authenticated` com EXECUTE |

Pendência de hardening (decisão de negócio, não de CI): revogar `authenticated` nessas cinco também,
como já foi feito em `anon` — depende de confirmar que nenhum consumidor externo (ERP/automação) as invoca.

## Baseline anterior (24/11) — 111 DEFINERs (banco canônico `pgxfvjmuubtbowutlide`, 2026-11-18)

Total verificado no gate de 2026-11-18: **111 DEFINERs**. A diferença para a baseline anterior é
`guard_contact_relation_write()`, da migration `20261027220000_serialize_contact_relation_writes.sql`.

Atenção ao histórico: a seção de 06/11 abaixo já descrevia essa função como parte de uma baseline de
110, mas a migration **nunca havia sido aplicada ao banco** — estava só no repositório, enquanto o
`CHANGELOG.md` da main já anunciava a proteção de concorrência como pronta. A baseline de 110 que o
gate media vinha, na verdade, de `cleanup_cron_job_run_details`. A migration foi de fato aplicada em
2026-11-18, levando o inventário real de 110 para 111.

Conferido no banco após aplicar: `prosecdef = true`, `proconfig = {search_path=""}`, `EXECUTE`
revogado de `PUBLIC`, `anon`, `authenticated` e `service_role`, e os 4 triggers instalados em
`contact_emails`, `contact_phones`, `contact_addresses` e `contact_social_media`. Comportamento
testado em produção: dono escrevendo na própria linha é liberado; o mesmo usuário escrevendo em
contato de outro dono é recusado com `42501`.

## Baseline anterior (11/11) — 110 DEFINERs (banco canônico `pgxfvjmuubtbowutlide` com migrations pendentes, 2026-11-11)

Total verificado no gate de 2026-11-11: 110 DEFINERs. A função `update_company_fields(uuid, jsonb)` — criada direto no banco, sem arquivo no repositório, e removida pela migration `20261029120000_drop_update_company_fields.sql` — não faz parte da baseline (comentário da própria migration: "devolve o inventário DEFINER à baseline de 109"). A migration `20261108190000_cron_job_run_details_retention.sql` acrescenta `cleanup_cron_job_run_details(_dias integer)` (DEFINER de manutenção; EXECUTE revogado explicitamente de PUBLIC, `anon` e `authenticated` — somente `service_role` pode chamar; agendada pelo pg_cron diariamente às 04:37 UTC). A função foi aplicada de fato no banco em 2026-11-11 (subindo a baseline de 109 para 110; antes estava registrada no ledger mas ausente do banco).

| Função | Escopo e proteção |
|---|---|
| `cleanup_cron_job_run_details(_dias integer)` | Somente `service_role`; `anon`/`authenticated` explicitamente revogados; apaga `cron.job_run_details` com mais de `_dias` dias; `search_path = public` fixo |
| `guard_contact_relation_write()` | Trigger DEFINER; EXECUTE revogado de todos os roles; chamado apenas pelo sistema de triggers; aplica lock no contato pai e valida ownership ou trusted_service antes de permitir INSERT/UPDATE/DELETE nas tabelas de relação (contact_emails, contact_phones, contact_addresses, contact_social_media); `search_path = ''` fixo |
| `merge_records_atomically(text, uuid, uuid, jsonb)` | `auth.role() = 'authenticated'`, `auth.uid()` presente, ambos os registros do dono, relações com dono verificável, overrides limitados, locks ordenados, auditoria e dados na mesma transação |
| `merge_companies(uuid, uuid)` | Alias; delega à RPC central sem contornar a validação |
| `merge_duplicate_companies(uuid, uuid)` | Alias; delega à RPC central sem contornar a validação |
| `merge_contacts(uuid, uuid)` | Alias; delega à RPC central sem contornar a validação |
| `merge_duplicate_contacts(uuid, uuid)` | Alias; delega à RPC central sem contornar a validação |

Todas as funções acima fixam `search_path` e revogam EXECUTE de roles não autorizados. A lista pública não muda. As verificações de função extra, grant ausente, `search_path` e exposição insegura a anon permanecem integrais.

### Baseline anterior (06/11) — 110 DEFINERs

Medido no banco canônico com as migrations pendentes até `20261027220000` aplicadas em transação revertida.
A migration `20261027220000_serialize_contact_relation_writes.sql` acrescenta `guard_contact_relation_write()` (DEFINER trigger; EXECUTE revogado de PUBLIC, anon, authenticated e service_role — somente postgres/supabase_admin chamam via trigger), passando de 109 para 110. Total verificado no gate de 2026-11-06.

### Baseline anterior (10/11) — 109 DEFINERs

Medido no banco canônico com as migrations pendentes até `20261013033435` aplicadas em transação revertida.
A migration `20261013033431_merge_records_atomically.sql` acrescentou uma RPC central DEFINER e transformou quatro aliases legados INVOKER em DEFINER, passando de 104 para 109.

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
