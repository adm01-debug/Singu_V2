# inventario/estado — o que existe de verdade, medido

Arquivos **gerados**, nunca escritos à mão. Leia antes de qualquer tarefa que toque banco ou edge
function: eles dizem o que existe hoje, não o que as migrations pretendiam.

| Arquivo | O que é | Fonte |
|---|---|---|
| `banco.json` | 406 tabelas com RLS/policies/triggers/linhas/bytes, 20 cron jobs com taxa de falha, tabelas órfãs e alertas | consulta de leitura `scripts/inventario/banco.sql` no banco oficial `pgxfvjmuubtbowutlide` |
| `edges.json` | 108 edge functions: linhas, segredos lidos (`Deno.env.get`) e quem invoca cada uma | código do repositório |
| `tabelas-uso.json` | quantos `.from('tabela')` cada tabela tem em `src/` e `supabase/functions/` | código do repositório |
| `edge-tabela.json` | o outro lado do `edges.json`: quais tabelas, RPCs, buckets e outras edges cada uma das 108 edge functions alcança, mais o índice inverso (dada a tabela, quais edges mexem nela) | código do repositório (`supabase/functions/<função>/**/*.ts`, seguindo `_shared/`) |
| `rotas.json` | 114 rotas do front: componente, arquivo, nível de acesso (pública/autenticada/protegida/admin), item de menu, e as tabelas, RPCs, edge functions, buckets e hooks que cada rota alcança | código do repositório (`AppRoutes.tsx`, `lazyPages.tsx`, `AppSidebar.tsx`, `MobileBottomNav.tsx` + imports de cada página) |

Regerado toda segunda pelo workflow [`inventario-estado-semanal.yml`](../../.github/workflows/inventario-estado-semanal.yml),
que abre PR em `automation/inventario-estado` **só quando o conteúdo muda** (carimbo de data não conta).
Tabela ou edge que aparece ou desaparece vira diff nessa PR.

## Rodar na mão

```bash
# 1) banco: rode scripts/inventario/banco.sql no MCP "SUPABASE - GESTAO DE CLIENTES" (db_query),
#    salve a resposta num arquivo e passe em --entrada
node scripts/inventario/gerar-banco.mjs --entrada /caminho/resposta.json

# 2) repositório (precisa de ripgrep)
node -e "require('./inventario/estado/banco.json').tabelas.forEach(t => console.log(t.nome))" > /tmp/tabelas.txt
node scripts/inventario/gerar-repo.mjs < /tmp/tabelas.txt

# 3) rotas do front e alcance das edge functions (só código, sem rede)
node scripts/inventario/gerar-rotas.mjs
node scripts/inventario/gerar-edge-tabela.mjs
node scripts/inventario/gerar-rotas.mjs --check        # exit 1 se o commitado está velho
node scripts/inventario/gerar-edge-tabela.mjs --check

# 4) mudou de verdade? (true/false, ignora medido_em/gerado_em)
node scripts/inventario/mudou-conteudo.mjs
```

## Limites

- `rotas.json` é parser de regex sobre JSX, não compilador: ele depende do formato atual do
  `AppRoutes.tsx` (um `<Route path=... element={<Protected><P.Pagina /></Protected>} />` por linha).
  Mudança grande na forma de declarar rota quebra o parser — por isso o teste
  `scripts/inventario/gerar-rotas.test.mjs` roda antes da geração no workflow.
- `rotas.json` e `edge-tabela.json` cobrem o que a página ou a função **alcança** por leitura
  estática (tabela, RPC, edge, bucket), com a mesma regra
  (`scripts/inventario/chamadas-supabase.mjs`): alcance não prova chamada em runtime, e nome de
  tabela em variável que não seja constante de string do mesmo arquivo, concatenação e SQL cru
  ficam de fora.
- Há um segundo inventário de rotas em `docs/contexto/codigo/rotas.json` (gerador genérico
  `scripts/ai-context/gerar.mjs`, branch `contexto`), com outro recorte: ele varre todo framework
  e não segue o fecho de imports da página.
- `edge_functions.publicadas` só é preenchido quando o secret `SUPABASE_ACCESS_TOKEN` existe
  (leitura de `GET /functions`). Com ele, função no ar sem código no repositório vira o alerta
  `edge_publicada_sem_codigo`; sem ele o campo fica `null` e o que está listado é apenas o que
  existe em `supabase/functions/`. Medido à mão em 2026-11-08: **151 deployadas contra 108
  versionadas** — 43 funções no ar sem código neste repositório.
- `citada_no_banco` e o uso de tabelas são extraídos estaticamente: referência encontrada não prova
  execução, e ausência de referência não prova que a tabela não é usada por cliente externo.
- A conferência de origem não usa `supabase/schema-manifest.json` (este repositório não o versiona);
  ela usa a versão máxima do ledger de migrations, que é exata.
