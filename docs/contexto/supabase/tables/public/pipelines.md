# public.pipelines

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `nome` | `character varying(100)` | não |  |  |  |
| 3 | `descricao` | `text` | sim |  |  |  |
| 4 | `tipo` | `character varying(50)` | sim | `'vendas'::character varying` |  |  |
| 5 | `is_active` | `boolean` | sim | `true` |  |  |
| 6 | `is_default` | `boolean` | sim | `false` |  |  |
| 7 | `permite_multiplos_deals` | `boolean` | sim | `true` |  |  |
| 8 | `valor_meta_mensal` | `numeric(15,2)` | sim |  |  |  |
| 9 | `ordem` | `integer` | sim | `0` |  |  |
| 10 | `created_by` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pipelines_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deals | deals_pipeline_id_fkey | pipeline_id | NO ACTION |
| _dormant.leads | leads_pipeline_id_fkey | pipeline_id | NO ACTION |
| _dormant.workflows | workflows_pipeline_id_fkey | pipeline_id | NO ACTION |
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
