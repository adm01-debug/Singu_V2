# Contexto para agentes de IA — como ler o estado real do Singu V2

Três produtores autônomos mantêm, sozinhos, um retrato atualizado do sistema. Nada aqui é escrito à mão
(exceto `regras/manual/`). Rodam a cada push em `main` e a cada 10 minutos pelo workflow
[`.github/workflows/contexto.yml`](../../.github/workflows/contexto.yml) e publicam na branch **`contexto`**.

## Antes de qualquer tarefa

```bash
git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md
```

Sem clone: `https://raw.githubusercontent.com/adm01-debug/Singu_V2/contexto/docs/contexto/00-INDEX.md`
ou, pelo MCP do GitHub, `github_get_content` com `ref=contexto`.

## Quem é dono de cada fato

| Pergunta | Fonte | Produtor |
|---|---|---|
| Rotas, telas, módulos, hooks, edge functions, grafo de dependências, testes, scripts, convenções | `docs/contexto/codigo/INDEX.md` | `scripts/ai-context/gerar.mjs` |
| Tabelas, colunas, RLS, funções, triggers, cron, storage, lints — **como está em produção agora** | `docs/contexto/supabase/` | `scripts/supabase_snapshot/snapshot.py` |
| O que pode/não pode: RLS por operação, estados, validações, fórmulas, prazos, lacunas | `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` | `scripts/regras_negocio/generate.py` |

Se duas fontes discordarem, **vale o dono do fato**. Migrations do repositório são histórico, não estado:
o que existe no banco é o que a fonte `supabase/` diz.

## Regras de uso

- A branch `contexto` é **gerada**: nunca edite, nunca abra PR dela, nunca faça merge dela em `main`.
- Regra que só o negócio sabe → escreva em `docs/contexto/regras/manual/` na **`main`** (texto humano,
  prioridade máxima; o produtor copia para a branch).
- Item marcado **NÃO VERIFICADO** ou **inconsistência**: confirme na fonte dona antes de assumir.

## Rodar local

```bash
npm run contexto:ia        # código  -> docs/contexto/codigo/
npm run contexto:regras    # regras  -> docs/contexto/regras/
npm run contexto:banco     # banco   -> docs/contexto/supabase/ (precisa de SUPABASE_DB_URL)
npm run contexto:indice    # monta docs/contexto/00-INDEX.md a partir dos manifests
npm run contexto:ia:test   # suíte do gerador de código
```

A saída é ignorada pelo `.gitignore` em `main` — ela só existe na branch `contexto`.

## Secrets

| Secret | Usado por | Sem ele |
|---|---|---|
| `SUPABASE_DB_URL` | job `banco` do `contexto.yml` (somente leitura, projeto `hjhthvzwtvwgdrochcam`) | o job sai verde com aviso e a pasta `supabase/` fica como estava |

Os produtores de código e de regras não usam secret nenhum: leem apenas arquivos do repositório e `git log`.
