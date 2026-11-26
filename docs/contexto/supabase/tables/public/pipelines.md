# public.pipelines

> Configuração de pipelines comerciais. Cada registro define um fluxo de trabalho de vendas, suas opções de múltiplas oportunidades, meta mensal e ordenação. PK: id. As etapas são relacionadas por public.pipeline_stages.pipeline_id.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_deals_full, public.vw_forecast_mensal, public.vw_leads_full, public.vw_pipeline_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID do pipeline e chave primária; gerado por gen_random_uuid(). |
| 2 | `nome` | `character varying(100)` | não |  |  | Nome de exibição do pipeline; obrigatório. |
| 3 | `descricao` | `text` | sim |  |  | Descrição textual do objetivo ou escopo do pipeline. |
| 4 | `tipo` | `character varying(50)` | sim | `'vendas'::character varying` |  | Categoria textual do pipeline; DEFAULT vendas. Valores aceitos não são restringidos no schema. |
| 5 | `is_active` | `boolean` | sim | `true` |  | Indica se o pipeline está ativo para uso; DEFAULT true. |
| 6 | `is_default` | `boolean` | sim | `false` |  | Indica se o pipeline está marcado como padrão; DEFAULT false. |
| 7 | `permite_multiplos_deals` | `boolean` | sim | `true` |  | Indica se a aplicação permite múltiplos deals no pipeline; DEFAULT true. |
| 8 | `valor_meta_mensal` | `numeric(15,2)` | sim |  |  | Meta mensal monetária configurada para o pipeline; unidade/moeda não definidas no schema. |
| 9 | `ordem` | `integer` | sim | `0` |  | Posição de ordenação do pipeline; DEFAULT 0. |
| 10 | `created_by` | `uuid` | sim |  |  | UUID do usuário que criou o pipeline; não há FK declarada na inspeção. |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do pipeline; timestamptz, DEFAULT now(). |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pipelines_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deals | deals_pipeline_id_fkey | pipeline_id | NO ACTION |
| _dormant.workflows | workflows_pipeline_id_fkey | pipeline_id | NO ACTION |
| public.leads | leads_pipeline_id_fkey | pipeline_id | NO ACTION |
| public.pipeline_stages | pipeline_stages_pipeline_id_fkey | pipeline_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| pipelines_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pipelines_pkey ON public.pipelines USING btree (id)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| update_pipelines_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
