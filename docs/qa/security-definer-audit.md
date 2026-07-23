# Auditoria SECURITY DEFINER — Rodada 49/10

> Objetivo: confirmar que toda função `SECURITY DEFINER` em `public.*` (a) trava `search_path` e (b) **não** assume `auth.uid()` — porque DEFINER + `auth.uid()` combinam de forma perigosa em endpoints públicos (o `auth.uid()` reflete o JWT do chamador, não do dono da função; qualquer regressão que remova o token vira NULL silencioso).

## Baseline atual (5 DEFINERs)

| Função | search_path travado | Usa `auth.uid()`? | Fonte de identidade | Status |
|---|---|---|---|---|
| `buyer_add_comment(text, text, text)` | ✅ `public, pg_temp` | ❌ | `share_token` + `deal_rooms.user_id` | OK |
| `buyer_toggle_milestone(text, uuid, boolean, text)` | ✅ `public, pg_temp` | ❌ | `share_token` + `deal_rooms.user_id` | OK |
| `has_role(uuid, app_role)` | ✅ `public, pg_temp` | ❌ | `_user_id` parâmetro explícito | OK |
| `submit_public_form(text, jsonb, jsonb, text, text)` | ✅ `public, pg_temp` | ❌ | `slug` + `forms.user_id` | OK |
| `track_magnet_download(text, text, text, jsonb)` | ✅ `public, pg_temp` | ❌ | `slug` + `lead_magnets.user_id` | OK |

**Resultado**: nenhuma anomalia. Todas as 5 funções derivam ownership do recurso público (token/slug) ou de parâmetro explícito, nunca de `auth.uid()` dentro do corpo DEFINER — padrão correto para endpoints acessíveis por `anon`.

## Invariantes

1. `proconfig` deve conter `search_path=public, pg_temp` (ou equivalente pinned).
2. Corpo da função (`prosrc`) não pode conter a string `auth.uid()`.
3. Novo DEFINER exige revisão manual e atualização deste doc + `tests/rls/security_definer_hardening.sql`.

## Cenários de gap prevenidos

- ❌ DEFINER com `search_path` mutável → hijack via schema shadow (`pg_temp.deal_rooms`).
- ❌ DEFINER que lê `auth.uid()` e cai em NULL quando chamado por `anon` sem JWT → escreve linhas órfãs.
- ❌ DEFINER que insere sem validar ownership do token → escrita cross-tenant.
- ❌ Novo DEFINER adicionado sem revoke de `PUBLIC` → escalada silenciosa.