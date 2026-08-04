---
name: UX Rodada G — Observabilidade Profunda & Hardening Final (5/5)
description: Rodada G consolida 35/35 melhorias. Undo destrutivo real em Contatos/Empresas via useRestoreEntity, hardening de meeting-summary, RUM Web Vitals → error_logs com filtro Performance, CI workflow GitHub Actions e docs/ARCHITECTURE.md + ADR-010.
type: feature
---

## Entregas (5/5)

1. **Undo destrutivo real**: `useActionToast.destructive` aplicado em
   `Contatos.handleDelete` e `Empresas.handleDelete`, com snapshot capturado
   antes do delete e restore via novo hook `useRestoreEntity` (`insertExternalData`
   com strip de campos LOCAL_ONLY).
2. **Hardening edge functions**: `meeting-summary` recebeu `rateLimit` (10/min/IP)
   + `requestId` em logs estruturados JSON. Inventário consolidado em
   `mem://architecture/edge-functions/security`.
3. **RUM Web Vitals → error_logs**: `useWebVitals` envia samples a `captureError`
   quando excede thresholds Google (LCP>2.5s, CLS>0.1, INP>200ms, FCP>1.8s,
   TTFB>800ms). Painel `/admin/error-logs` ganha filtro de fonte
   ("Todos / Erros / Performance").
4. **CI workflow**: `.github/workflows/ci.yml` roda em cada push/PR:
   `npm ci → tsc --noEmit → vitest run → npm run build → check-bundle-size`.
5. **Documentação viva**: `docs/ARCHITECTURE.md` (stack, fluxo, resiliência,
   segurança, observabilidade, rotas) + `docs/adr/010-excellence-sustained-rodada-g.md`.

## Arquivos novos
- `src/hooks/useRestoreEntity.ts`
- `.github/workflows/ci.yml`
- `docs/ARCHITECTURE.md`
- `docs/adr/010-excellence-sustained-rodada-g.md`

## Marco
**35/35 melhorias entregues. Excelência 10/10 sustentada.**
