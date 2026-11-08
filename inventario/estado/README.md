# inventario/estado — o que existe de verdade, medido

Arquivos **gerados**, nunca escritos à mão. Leia antes de qualquer tarefa que toque banco ou edge
function: eles dizem o que existe hoje, não o que as migrations pretendiam.

| Arquivo | O que é | Fonte |
|---|---|---|
| `banco.json` | 406 tabelas com RLS/policies/triggers/linhas/bytes, 20 cron jobs com taxa de falha, tabelas órfãs e alertas | consulta de leitura `scripts/inventario/banco.sql` no banco oficial `pgxfvjmuubtbowutlide` |
| `edges.json` | 108 edge functions: linhas, segredos lidos (`Deno.env.get`) e quem invoca cada uma | código do repositório |
| `tabelas-uso.json` | quantos `.from('tabela')` cada tabela tem em `src/` e `supabase/functions/` | código do repositório |

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

# 3) mudou de verdade? (true/false, ignora medido_em/gerado_em)
node scripts/inventario/mudou-conteudo.mjs
```

## Limites

- **Rotas do front não estão aqui.** Elas saem do gerador genérico de contexto
  (`scripts/ai-context/gerar.mjs` → `docs/contexto/codigo/rotas.json`, 114 rotas).
- `edge_functions.publicadas` fica `null`: ler as funções publicadas exigiria
  `SUPABASE_ACCESS_TOKEN`, que este repositório não tem. O que está listado é o que existe em
  `supabase/functions/`.
- `citada_no_banco` e o uso de tabelas são extraídos estaticamente: referência encontrada não prova
  execução, e ausência de referência não prova que a tabela não é usada por cliente externo.
- A conferência de origem não usa `supabase/schema-manifest.json` (este repositório não o versiona);
  ela usa a versão máxima do ledger de migrations, que é exata.
