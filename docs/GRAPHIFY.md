# Graphify

O projeto usa o Graphify para manter um grafo navegável das relações entre arquivos, símbolos, dependências e objetos SQL.

## Instalação

O CLI fica isolado das dependências JavaScript e usa uma versão fixada com suporte a SQL:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install --force 'graphifyy[sql]==0.9.67'
graphify install --project --platform devin
```

## Comandos

```bash
# Reconstrução determinística e local, sem API ou custo de LLM
npm run graphify:build

# Atualização incremental após mudanças de código
npm run graphify:update

# Consulta do grafo
npm run graphify:query -- "Como a autenticação usa o Supabase?"
```

O build padrão usa `--code-only`: TypeScript, JavaScript, SQL e demais linguagens suportadas são analisados localmente por AST. Documentos e imagens não são enviados a serviços externos.

## Artefatos versionados

- `graphify-out/graph.json`: grafo consultável.
- `graphify-out/GRAPH_REPORT.md`: relatório estrutural.
- `graphify-out/graph.html`: visualização interativa.

Caches, manifestos locais, custos e memória de consultas permanecem fora do Git.
