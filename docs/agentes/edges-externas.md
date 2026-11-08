# As 43 edge functions sem código neste repositório

**Decisão do dono (2026-11-08): manter.** Elas ficam no ar. Este documento existe para que nenhum
agente as trate como código morto e as apague.

O projeto Supabase **`pgxfvjmuubtbowutlide`** é compartilhado. Em 2026-11-08 ele tinha **151 edge
functions deployadas**, todas `ACTIVE`: **108** com código em `supabase/functions/` deste
repositório e **43** sem código aqui. Nenhuma função do repositório está sem deploy.

As 43 **não** pertencem ao Singu nem ao Zapp Web V2 (cujo repositório tem 86 funções e também não
contém nenhuma delas). São de outro sistema do mesmo dono — integrações de logística/ERP e um bloco
de IA/ML —, criadas entre **08/03** e **05/04/2026**, com redeploy em lote em **11/04/2026** numa
janela de ~2 h. A única fora do padrão é `mcp-query` (09/09/2026).

## O que importa antes de mexer

### 1. Vinte e três aceitam chamada sem autenticação

`verify_jwt = false` significa que qualquer pessoa que descubra a URL
`https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/<slug>` chama a função **sem token**. Como
são proxies para APIs de terceiros, as chaves daqueles serviços ficam nos segredos da edge — ou
seja, quem chama usa as chaves do dono sem precisar de credencial nenhuma.

| slug | versão | criada | último deploy |
|---|---|---|---|
| `bigquery-cnpj-proxy` | v11 | 2026-03-16 | 2026-04-11 15:27 |
| `bigquery-proxy` | v12 | 2026-03-08 | 2026-04-11 15:01 |
| `bitrix-extract-companies` | v11 | 2026-03-13 | 2026-04-11 15:54 |
| `bitrix24-proxy` | v11 | 2026-03-15 | 2026-04-11 13:48 |
| `bling-proxy` | v11 | 2026-03-16 | 2026-04-11 15:51 |
| `cloudflare-proxy` | v11 | 2026-03-15 | 2026-04-11 15:28 |
| `comtele-proxy` | v11 | 2026-03-15 | 2026-04-11 15:25 |
| `coop003-executor` | v11 | 2026-03-08 | 2026-04-11 15:53 |
| `coop004-pacs-report` | v11 | 2026-03-08 | 2026-04-11 15:54 |
| `evolution-proxy` | v11 | 2026-03-15 | 2026-04-11 13:49 |
| `fornecedores-proxy` | v11 | 2026-03-15 | 2026-04-11 15:25 |
| `lalamove-uapi-proxy` | v12 | 2026-03-15 | 2026-04-11 15:04 |
| `lalamove-unified` | v11 | 2026-03-15 | 2026-04-11 15:06 |
| `lalamove-v3-proxy` | v11 | 2026-03-15 | 2026-04-11 15:05 |
| `leadcontact-proxy` | v12 | 2026-03-15 | 2026-04-11 15:53 |
| `lusha-proxy` | v11 | 2026-03-16 | 2026-04-11 15:48 |
| `mapbox-proxy` | v11 | 2026-03-16 | 2026-04-11 15:48 |
| `mcp-query` | v4 | 2026-09-09 | 2026-09-09 13:17 |
| `phantombuster-proxy` | v11 | 2026-03-16 | 2026-04-11 15:50 |
| `rodonaves-unified` | v12 | 2026-03-15 | 2026-04-11 15:52 |
| `spot-unified` | v11 | 2026-03-15 | 2026-04-11 15:24 |
| `xbz-api-proxy` | v12 | 2026-03-08 | 2026-04-11 15:03 |
| `xbz-unified` | v11 | 2026-03-15 | 2026-04-11 15:07 |

### 2. Vinte exigem JWT — e três delas são dependência viva deste banco

`verify_jwt = true`, bloco de IA/ML:
`agent-card-generator`, `ai-compliance`, `autotrain-config-generator`, `context-optimizer`,
`cost-calculator`, `doc-layout-analyzer`, `eval-engine-v2`, `guardrails-ml`, `health-monitor`,
`hf-space-tool`, `hf-toolbox`, `media-pipeline`, `nlp-pipeline`, `product-description-gen`,
`rag-embed-v2`, `rag-rerank-v2`, `sentence-similarity`, `smart-model-router`,
`smolagent-runtime-v2`, `synthetic-data-gen` (criadas 05/04, deploy 11/04, v11–v15).

**Três são chamadas por funções SQL que vivem neste banco**, no schema `zapp_history`:

| função SQL | chama a edge |
|---|---|
| `zapp_history.request_classify` | `media-pipeline` |
| `zapp_history.request_transcription` | `media-pipeline` |
| `zapp_history.request_embedding` | `rag-embed-v2` |
| `zapp_history.request_nlp` | `nlp-pipeline` |

As quatro apontam para `https://pgxfvjmuubtbowutlide.supabase.co`, o próprio projeto, e nenhuma
tem JWT literal no corpo. **Apagar `media-pipeline`, `rag-embed-v2` ou `nlp-pipeline` quebra o
pipeline de NLP/transcrição/embedding que roda neste banco.**

## O que foi medido e o que não foi

Medido em 2026-11-08, somente leitura:

- 151 deployadas / 108 versionadas / 43 sem código / 0 no repo sem deploy
- `verify_jwt` de cada uma das 43 (23 `false`, 20 `true`); todas `ACTIVE`
- nenhuma das 43 é agendada por `cron.job`; só as 3 acima aparecem em corpo de função SQL
- nenhuma das 43 aparece em `src/` nem nas edges do repositório
- nenhuma das 43 está no repositório do Zapp Web V2

**NÃO VERIFICADO:** quem chama as outras 40. A janela de log consultável é de **24 h**, e nela
só três funções do projeto foram invocadas (`external-data`, `territory-optimization`,
`bulk-revalidate`) — nenhuma das 43. Vinte e quatro horas não provam que uma função mensal, ou
chamada por sistema externo, esteja morta. Também não há como ler o código delas daqui: ele não
está em nenhum dos dois repositórios.

## Regras para agentes

- **Não apague, não desative e não faça redeploy** de nenhuma das 43. Elas são de outro sistema.
- A lista legível por máquina é [`scripts/inventario/edges-externas.txt`](../../scripts/inventario/edges-externas.txt).
  O inventário semanal usa esse arquivo como allowlist: o alerta `edge_publicada_sem_codigo` passa
  a apontar **só função deployada que não está no repositório nem nesta lista** — isto é, uma
  44ª desconhecida aparecendo. Isso é alerta de verdade; investigue.
- O campo `edge_functions.externas` do `inventario/estado/banco.json` traz, a cada coleta,
  quantas estão catalogadas, quais estão no ar e **quais aceitam chamada sem JWT**. O fato fica
  visível toda semana sem virar alarme repetido.
- Se uma das 43 ganhar código neste repositório, tire o slug do `edges-externas.txt` no mesmo PR.
