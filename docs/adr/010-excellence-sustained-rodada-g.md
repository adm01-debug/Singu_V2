# ADR-010: Excelência Sustentada — 35/35 Melhorias (Rodadas A–G)

**Status:** Aceita
**Data:** 2026-04-19
**Decisores:** Equipe de Engenharia

## Contexto

O projeto SINGU CRM atingiu o marco de 30 melhorias entregues nas Rodadas A–F.
A Rodada G consolidou 5 melhorias adicionais focadas em camadas ainda não
cobertas: telemetria real-user, hardening de edge functions, automação CI,
documentação viva e wire-up final do `useActionToast.destructive` em deletes
de UI (Contatos, Empresas) com Undo via snapshot.

## Decisão

### Rodada G — entregues
1. **Undo destrutivo real**: handlers de delete em `Contatos.tsx` e `Empresas.tsx`
   passam snapshot ao `useActionToast.destructive`; `useRestoreEntity` re-insere
   via `insertExternalData`.
2. **Hardening edge functions**: `meeting-summary` ganhou `rateLimit`
   (10/min/IP) + `requestId` em logs estruturados. Inventário em
   `mem://architecture/edge-functions/security`.
3. **RUM Web Vitals**: `useWebVitals` captura LCP/CLS/INP/FCP/TTFB e envia
   amostras ao pipeline `errorReporting` quando excede thresholds Google
   ("good" → "poor"). Painel `/admin/error-logs` ganha filtro de fonte
   "Performance".
4. **CI workflow**: `.github/workflows/ci.yml` roda typecheck, vitest, build
   e `check-bundle-size.mjs` em cada push/PR.
5. **Documentação viva**: `docs/ARCHITECTURE.md` consolida stack, fluxo de
   dados, resiliência, segurança, observabilidade, rotas críticas e padrões
   obrigatórios.

## Consequências

- **Positivo**: Telemetria fechada (erros JS + queries + Web Vitals → painel
  admin único). CI bloqueia regressão de bundle e testes. Undo real elimina
  risco percebido em deletes.
- **Positivo**: Documentação viva facilita onboarding e auditorias.
- **Trade-off aceitável**: Restore via re-insert mantém o `id` original mas não
  restaura tabelas relacionadas (e.g. interactions vinculadas). Suficiente para
  Undo de curto prazo (5s).

## Marco

35/35 melhorias entregues. Excelência 10/10 sustentada.
