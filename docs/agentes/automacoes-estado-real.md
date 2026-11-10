# Automações de estado real

Scripts que leem o repositório (e o GitHub) e falham quando o que está escrito deixa de bater
com o que existe. Nenhum deles altera código: ou reprovam um check, ou publicam num lugar fixo.

Portados do `adm01-debug/Zapp_Web_V2`, onde a mesma família de automações já roda.

## O que já existia neste repo

| Automação | Onde | Quando | Prova |
| --- | --- | --- | --- |
| Contexto para agentes (3 produtores + índice) | `.github/workflows/contexto.yml` · `scripts/ai-context/`, `scripts/supabase_snapshot/`, `scripts/regras_negocio/` | a cada 10 min e em push na `main` | branch `contexto` com `docs/contexto/{codigo,supabase,regras}/` regerados do código, do banco oficial e das regras |
| Inventário do estado real | `.github/workflows/inventario-estado-semanal.yml` · `scripts/inventario/` | segunda 10:23 UTC | `inventario/estado/` refeito do banco (leitura) e do código; abre PR quando o conteúdo muda |

Como ler o contexto sem gastar token em busca:

```bash
git show origin/contexto:docs/contexto/00-INDEX.md
```

## O que este conjunto acrescenta

### `estado-real.yml` — na PR e no push em `main`

| Script | Reprova quando |
| --- | --- |
| `scripts/ci/check-test-inventory.mjs` | existe teste no disco que nenhum bloco `run:` de workflow executa (Deno `*_test.ts` e Node `*.test.mjs`/`*.unit.mjs`/`*.integration.mjs`) |
| `scripts/ci/workflow-invariants.mjs` | `ci.yml` duplica `npm run test:coverage`, um required check ganha `if: always()` no nível do job, ou o upload de `dist` perde o `if:` |
| `scripts/ci/check-claude-md-integrity.mjs` | `AGENTS.md` perde uma seção obrigatória, ou o conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` encolhe mais de 30% (ou um arquivo, 50%) contra a `main` |

A `ALLOWLIST_DENO` de `check-test-inventory.mjs` registra os 15 testes Deno que já estavam fora
do CI quando o guarda nasceu. É catraca: a lista só encurta, e o teste
`scripts/ci/check-test-inventory.test.mjs` reprova se um item dela passar a rodar e continuar listado.

### `higiene-semanal.yml` — segunda 08:41 UTC

| Script | Publica |
| --- | --- |
| `scripts/ci/branch-podaveis.mjs` | bloco `git push origin --delete` pronto para revisão, só com branch patch-equivalente à `main`, sem PR aberta, sem commit nos últimos 7 dias e com nome seguro. **Não apaga nada** |
| `scripts/ci/actions-kpi.mjs` | issue `[kpi-actions]`: runs, cancelamentos, falhas, minutos por workflow e os 5 jobs mais lentos dos últimos 7 dias |
| `scripts/ci/sla-code-scanning.mjs` | alertas abertos de code scanning fora do SLA — **este reprova o job** |
| `scripts/ci/bump-toolchain.mjs` | versão mais nova das ferramentas fixadas em `.github/toolchain.json` |

Os relatórios vão para duas issues fixas (`[branch-hygiene]` e `[kpi-actions]`), atualizadas a cada
semana em vez de empilhadas.

## Rodar na mão

```bash
npm run estado:testes
```

```bash
npm run estado:workflows
```

```bash
npm run estado:instrucoes
```

```bash
node --test scripts/ci/*.test.mjs scripts/lib/*.test.mjs
```
