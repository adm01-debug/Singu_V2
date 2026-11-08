# public.pipeline_stages

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
| usada por views | public.v_pipeline_summary, public.vw_deals_full, public.vw_leads_full, public.vw_pipeline_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `pipeline_id` | `uuid` | não |  |  |  |
| 3 | `nome` | `character varying(100)` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `cor` | `character varying(7)` | sim | `'#3498db'::character varying` |  |  |
| 6 | `ordem` | `integer` | não |  |  |  |
| 7 | `probabilidade` | `integer` | sim | `0` |  |  |
| 8 | `is_initial` | `boolean` | sim | `false` |  |  |
| 9 | `is_won` | `boolean` | sim | `false` |  |  |
| 10 | `is_lost` | `boolean` | sim | `false` |  |  |
| 11 | `sla_horas` | `integer` | sim |  |  |  |
| 12 | `campos_obrigatorios` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pipeline_stages_pipeline_id_fkey | FOREIGN KEY | `FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| pipeline_stages_pipeline_id_ordem_key | UNIQUE | `UNIQUE (pipeline_id, ordem)` |  |  | sim |
| pipeline_stages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pipeline_stages_probabilidade_check | CHECK | `CHECK (probabilidade >= 0 AND probabilidade <= 100)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deal_history | deal_history_stage_anterior_id_fkey | stage_anterior_id | NO ACTION |
| _dormant.deal_history | deal_history_stage_novo_id_fkey | stage_novo_id | NO ACTION |
| _dormant.deals | deals_stage_id_fkey | stage_id | NO ACTION |
| _dormant.lead_history | lead_history_stage_anterior_id_fkey | stage_anterior_id | NO ACTION |
| _dormant.lead_history | lead_history_stage_novo_id_fkey | stage_novo_id | NO ACTION |
| _dormant.leads | leads_stage_id_fkey | stage_id | NO ACTION |
| _dormant.sla_configs | sla_configs_pipeline_stage_id_fkey | pipeline_stage_id | CASCADE |
| _dormant.workflow_triggers | workflow_triggers_stage_from_id_fkey | stage_from_id | NO ACTION |
| _dormant.workflow_triggers | workflow_triggers_stage_to_id_fkey | stage_to_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pipeline_stages_pipeline_id | btree | pipeline_id | não | sim |  | `CREATE INDEX idx_pipeline_stages_pipeline_id ON public.pipeline_stages USING btree (pipeline_id)` |
| pipeline_stages_pipeline_id_ordem_key | btree | pipeline_id, ordem | sim | sim |  | `CREATE UNIQUE INDEX pipeline_stages_pipeline_id_ordem_key ON public.pipeline_stages USING btree (pipeline_id, ordem)` |
| pipeline_stages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pipeline_stages_pkey ON public.pipeline_stages USING btree (id)` |


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
| update_pipeline_stages_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
