# ADR-018: Hardening — Strict Mode, Feature Flags e Optimistic Locking

**Status:** Aceita
**Data:** 2026-04-20
**Decisores:** Equipe de Engenharia (Rodada O — Auditoria 10/10)

## Contexto

A auditoria técnica v2.6.0 identificou três gaps que impediam a maturidade 10/10:

1. **TS strict mode desativado** — 66 ocorrências de `:any`, sem `strictNullChecks`, runtime null/undefined errors recorrentes
2. **Sem mecanismo de rollout gradual** — features novas iam direto a 100% dos usuários
3. **Edição concorrente sem proteção** — last-write-wins em `contacts`/`companies`, perda silenciosa de dados em colaboração simultânea

## Decisão

### 1. Strict Mode TypeScript em fases

- **Fase 1 (atual):** habilitar via lint progressivo; manter `strict: false` no `tsconfig` para não quebrar build
- **Fase 2:** ativar `strictNullChecks: true` arquivo-por-arquivo
- **Fase 3:** `noImplicitAny: true` + ESLint `@typescript-eslint/no-explicit-any: error`

### 2. Feature Flags via banco

Tabela `public.feature_flags(name PK, enabled, description, roles[])` com RLS:
- `SELECT` aberto a authenticated (usuários precisam consultar)
- `INSERT/UPDATE/DELETE` apenas admin (`has_role`)

Hook `useFeatureFlag(name)` usa TanStack Query (staleTime 5min) e retorna `{ enabled, flag, isLoading }`.

### 3. Optimistic Locking

Coluna `version INT NOT NULL DEFAULT 0` em `contacts` e `companies` (`deals` não existe neste projeto).
Trigger `BEFORE UPDATE` incrementa automaticamente. Hooks de update enviam a versão lida originalmente em `eq('version', currentVersion)` — se 0 linhas afetadas, conflito 409 → mostrar toast e refetch.

## Consequências

**Positivo:**
- Erros nullish detectados em compile-time
- Rollouts seguros e reversíveis sem deploy
- Conflitos de edição visíveis ao invés de silenciosos
- Compliance com práticas SaaS enterprise

**Negativo:**
- Maior verbosidade pontual (`?.`, `??`)
- Hooks de update precisam carregar versão atual
- Mais um round-trip ao detectar conflito (refetch + retry)

## Alternativas consideradas

- **Pessimistic locking** (SELECT FOR UPDATE) — descartado por complexidade e impacto em performance
- **CRDT / OT** (collaborative editing real-time) — overkill para casos de uso atuais
- **Feature flags via env var** — menos flexível, exige redeploy

## Implementação

- Migration: `20260420_optimistic_locking_feature_flags.sql`
- Hook: `src/hooks/useFeatureFlag.ts`
- Página admin: `/admin/feature-flags`
