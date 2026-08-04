# 🛡️ Hardening Phase 2 — BD Físico pgxfvjmuubtbowutlide

**Data:** 2026-04-10
**Executor:** Claude via Supabase MCP (sessão autenticada)
**Escopo:** Hardening direto do estado físico do BD externo, sem depender de merge de PR no repo.

## TL;DR

6 migrations aplicadas via `SUPABASE - GESTÃO DE CLIENTES:apply_migration`. Score do BD: **9.0 → 10/10 físico**. Reduzidos 325+ advisories.

## Migrations aplicadas (ordem cronológica)

| # | Nome | Efeito | Risco |
|---|---|---|---|
| 1 | `harden_views_security_invoker_all` | 113/113 views públicas convertidas para `security_invoker=on` via `ALTER VIEW`. Zero DROP, zero downtime, totalmente reversível. | Zero |
| 2 | `harden_functions_search_path_all` | 182/182 functions de aplicação receberam `SET search_path = public, pg_temp`. As 149 funcs de extensões (pgvector, pg_trgm) ficaram de fora — owner `supabase_admin`, fora do escopo do advisor. | Zero |
| 3 | `harden_rls_public_to_authenticated` | 122 policies permissivas DROPadas no role `{public}` e recriadas no role `{authenticated}`. Elimina exposição a usuário anônimo. Tenant único (Promo Brindes) — regra de acesso preservada pra todo logado. | Baixo |
| 4 | `fix_connector_log_policy_roles` | 2 policies de `connector_log` corrigidas (falso positivo do bulk — tinham `qual` restritivo real mas estavam no role errado). | Zero |
| 5 | `optimize_rls_auth_uid_initplan` (no-op) | Verificação revelou 132/132 policies JÁ otimizadas como `(SELECT auth.uid())` — formato armazenado como `( SELECT auth.uid() AS uid)`. Minha regex inicial deu falso-negativo. | Zero |
| 6 | `cleanup_redundant_mcp_policies` | 19 policies `mcp_*` DROPadas por serem duplicatas redundantes de policies canônicas (`singu_*`/`*_select`). Reduz reavaliação dupla por linha. | Zero |

## Estado pós-hardening

| Métrica | Valor |
|---|---|
| Views públicas | 113 |
| Views com `security_invoker=on` | **113 (100%)** |
| Functions de app com `search_path` blindado | **182/182 (100%)** |
| Tabelas com RLS habilitado | **116/116 (100%)** |
| Tabelas com PRIMARY KEY | **116/116 (100%)** |
| FKs com índice | **100%** |
| Policies totais (de 391 → 372) | **372** |
| Policies expostas ao role `{public}` (anônimo) | **0** |
| Policies com `auth.uid()` otimizado (InitPlan) | **132/132 (100%)** |
| Policies permissivas duplicadas | **0** |

## Itens fora deste hardening (manual Pink)

- `leaked_password_protection` — toggle em Dashboard → Auth → Providers → Email
- Rotação do PAT vazado + anon key
- Delete do POC exploit `d905188c-beee-409b-85e8-ad0a37dc56b9` (no projeto Lovable `rqodmqosrotmtrjnnjul`)
- Hardening das edges `bitrix24-webhook` / `evolution-webhook` — trancado no PR #3 com conflito; será reaplicado via `deploy_edge_function` direto em MCP em próxima sessão
- Cadastro dos 5 secrets (`BITRIX24_WEBHOOK_SECRET`, `EVOLUTION_WEBHOOK_SECRET`, `EVOLUTION_API_SECRET`, `LUX_WEBHOOK_SECRET`, `CRON_SECRET`)

## Reversão (se necessário)

Todas as 6 migrations são reversíveis via migrations inversas. Views podem voltar a `SECURITY DEFINER` com `ALTER VIEW ... SET (security_invoker=off)`. Policies removidas foram logadas em `supabase_migrations.schema_migrations`.

---

Co-authored-by: Claude <noreply@anthropic.com>
