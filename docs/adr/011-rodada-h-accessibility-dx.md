# ADR-011 — Rodada H: Acessibilidade WCAG AA, DX e Polimento Final

**Data:** 2026-04-19  
**Status:** Aceito  
**Autores:** Equipe SINGU CRM

## Contexto

Após 35 melhorias entregues nas rodadas A-G, restavam camadas verticais
ainda intocadas: rigor formal de acessibilidade WCAG 2.1 AA, ferramentas
internas de DX (gallery de componentes), centralização de atalhos e
documentação executiva consolidada.

## Decisão

Executar **Rodada H** com 5 melhorias atômicas:

1. **Auditoria WCAG 2.1 AA** — checklist documentado em
   `mem://standards/accessibility-wcag-aa`. Confirma que SkipNav,
   RouteAnnouncer, `aria-current`, toasts acessíveis, loaders semânticos
   e foco visível estão wired em todas as superfícies críticas.
2. **Component Gallery** em `/admin/component-gallery` — Storybook-lite
   com variantes vivas das primitivas Button, Card, Badge, EmptyState,
   ActionToast e Loaders.
3. **Atalhos globais consolidados** — verificação de que
   `useKeyboardShortcutsEnhanced` + `KeyboardShortcutsCheatsheet` (`?`)
   centralizam toda a descoberta de atalhos.
4. **Saúde agregada** — edge function `system-health` reaproveitada como
   agregador único (DB local/externo, WhatsApp, email, voice).
5. **ADR-011 + CHANGELOG sintético** — esta ADR e
   `CHANGELOG.md` na raiz consolidam rodadas A→H.

## Consequências

- **Positivas**: cobertura WCAG AA documentada, DX para QA visual via
  gallery, base limpa para futuras adições; atalhos descobríveis;
  rastreabilidade total via ADR + memória.
- **Trade-offs**: Component Gallery é admin-only (não exposta a usuários
  finais) e exige manutenção paralela quando novas primitivas são
  adicionadas.

## Status final

**40/40 melhorias** entregues nas rodadas A-H. Sistema em estado de
excelência sustentada.
