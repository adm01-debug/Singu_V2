# Auditoria SECURITY DEFINER — Rodada 49/10

> Objetivo: confirmar que **toda** função `SECURITY DEFINER` em `public.*` (a) trava `search_path`; e que nenhum DEFINER **exposto a `anon`** lê `auth.uid()` — combinação perigosa: `anon` sem JWT resulta em `auth.uid() = NULL` e o DEFINER escreve linhas órfãs ou cross-tenant.

## Baseline atual — 63 DEFINERs

- **Total DEFINER em `public.*`**: 63
- **DEFINERs expostos a `anon`** (endpoints públicos): 9 (Deal Rooms, Landing/Forms, Lead Magnets — ver `functions-authenticated-allowlist.md`)
- **DEFINERs expostos a `anon` que usam `auth.uid()`**: **0** ✅
- **DEFINERs sem `search_path` travado**: **0** ✅

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