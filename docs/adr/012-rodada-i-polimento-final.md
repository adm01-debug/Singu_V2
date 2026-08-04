# ADR-012 — Rodada I: Polimento Final & Hardening Profundo

**Status:** Accepted
**Date:** 2026-04-20
**Supersedes:** ADR-011 (continuidade)

## Contexto
Após 40 melhorias atômicas (Rodadas A-H), restavam camadas ainda não cobertas:
- Auditoria a11y só documental, sem teste automatizado
- Atalhos globais sem possibilidade de extensão por página
- Component Gallery cobria apenas primitivas básicas (sem estados de erro complexos)
- CHANGELOG sem padrão semântico estrito
- Faltava registro formal do gate a11y no CI

## Decisões

### 1. Gate a11y no CI via vitest-axe
- Adotado `vitest-axe` + `axe-core` para testes automáticos.
- Localização: `src/test/a11y/`.
- Critério de falha: violations com impact `serious` ou `critical`.
- Cobertura inicial: primitivas críticas (Button, Badge, EmptyState, Form).

### 2. Shortcut registry público
- Novo módulo `src/lib/keyboardShortcutRegistry.ts`.
- API: `registerShortcut`, `useScopedShortcut`, `getRegisteredShortcuts(scope)`.
- Páginas registram atalhos contextuais sem editar hook global.

### 3. Component Gallery v2
- Adicionadas tabs para `ExternalDataCard` (5 estados) e `BulkActionsBar`.
- Garante QA visual de estados raros (circuit open, erro, empty).

### 4. CHANGELOG Keep-a-Changelog estrito
- Formato: seções `### Added | Changed | Fixed | Security | Removed` por versão.
- Tag atual: `v2.1.0` (Rodada I).

### 5. Versionamento
- SemVer estrito: MAJOR para breaking changes, MINOR para Rodadas (novas features), PATCH para hotfixes.

## Consequências
- ✅ Regressões a11y detectadas em CI antes do merge.
- ✅ Páginas podem registrar atalhos locais sem inflar o hook global.
- ✅ CHANGELOG legível por humanos e parseable por ferramentas de release.
- ⚠️ axe-core gera warnings benignos sobre `HTMLCanvasElement.getContext` no jsdom (não afeta testes).

## Arquivos-chave
- `src/test/a11y/critical-components.test.tsx`
- `src/lib/keyboardShortcutRegistry.ts`
- `src/pages/admin/ComponentGallery.tsx` (tabs `external`, `bulk`)
- `CHANGELOG.md` (reformatado v2.1.0)
- `.lovable/memory/features/ux-rodada-i-polimento-profundo.md`

## Status Final
**45/45 melhorias atômicas entregues** (Rodadas A-I). Excelência sustentada com cobertura automatizada de a11y.
