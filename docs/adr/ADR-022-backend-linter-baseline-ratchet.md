# ADR-022 — Backend Linter Baseline Ratchet

**Data:** 23/07/2026 · **Status:** Aceito · **Rodada:** 32/10 (Onda F)

## Contexto

Rodadas 27–31 fecharam o hardening estático (ESLint/TS/CORS 0/0). Restava o
backend linter Supabase com **109 WARN** — todos do tipo
`0028_anon_security_definer_function_executable` (16) +
`0029_authenticated_security_definer_function_executable` (90) +
3 warnings de infra (`pg_net` no schema `public`, 2 buckets públicos).

Auditoria da Rodada 32/10 mapeou cada função SECURITY DEFINER, sua assinatura,
grants efetivos (`has_function_privilege`) e callers reais em `src/**` e
`supabase/functions/**`.

## Decisão

1. Baseline de linter WARN é fonte da verdade em
   `.lovable/memory/architecture/security/linter-baseline.md` — cada WARN tem
   entrada individual com justificativa.
2. Novo WARN sem entrada no baseline bloqueia review. Correção padrão:
   `REVOKE EXECUTE ON FUNCTION public.<fn>(<args>) FROM anon, authenticated, PUBLIC;`
   mantendo apenas o grant estritamente necessário.
3. `scripts/check-backend-linter-baseline.mjs` compara a contagem atual contra
   o teto documentado (46) e falha em drift positivo.
4. Funções trigger não recebem `GRANT EXECUTE` a nenhum papel client —
   triggers disparam via table owner independente de grant.
5. Funções chamadas apenas por edge functions com `service_role` não têm grant
   a `authenticated`.

## Consequências

- Redução imediata: **109 → 46 WARN** (−58%), sem regressão funcional.
- 7 funções internas do pipeline comportamental deixaram de ser callable por anon.
- 33 triggers + 23 funções internas restritas a `service_role`.
- Dívida futura (Bucket B): conversão DEFINER → INVOKER de funções que não
  precisam bypassar RLS. Rastreado em `docs/qa/findings.md`.

## Rollback

Cada `REVOKE EXECUTE` é reversível via `GRANT EXECUTE ... TO <role>;`. Sem
`DROP`, sem mudança de assinatura ou corpo.
