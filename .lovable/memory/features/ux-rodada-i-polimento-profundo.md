---
name: Rodada I — Polimento Final & Hardening Profundo
description: 45/45 melhorias atômicas. Adiciona testes a11y axe, registry de atalhos contextuais, Gallery v2 com 5 estados de ExternalDataCard/BulkActionsBar, edge function health-aggregate, CHANGELOG Keep-a-Changelog estrito e ADR-012.
type: feature
---
- Testes a11y: `src/test/a11y/critical-components.test.tsx` roda axe-core em Button/Badge/EmptyState/Form. Falha em violations serious/critical.
- Registry de atalhos: `src/lib/keyboardShortcutRegistry.ts` expõe `registerShortcut`, `useScopedShortcut`, `getRegisteredShortcuts(scope)`. Permite páginas adicionarem atalhos locais (Pipeline J/K, Inbox R) sem editar o hook global.
- Component Gallery v2: tabs `external` (5 estados: loading/circuit-open/error/empty/data) e `bulk` (BulkActionsBar com seleção mock).
- Edge function `health-aggregate`: agrega DB local/externo, WhatsApp, email, voice + métricas extras (active alerts count). Endpoint público (`verify_jwt = false` por padrão Lovable).
- CHANGELOG.md em formato Keep-a-Changelog estrito (Added/Changed/Fixed/Security por versão), tag v2.1.0.
- ADR-012 (`docs/adr/012-rodada-i-polimento-final.md`) registra padrão de versionamento + gate a11y no CI.
- Total acumulado: **45/45 melhorias atômicas** (Rodadas A-I).
