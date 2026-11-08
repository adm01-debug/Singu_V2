# _dormant.deals

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_deals_full, public.vw_forecast_mensal, public.vw_pipeline_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `codigo` | `character varying(20)` | sim |  |  |  |
| 3 | `titulo` | `character varying(255)` | não |  |  |  |
| 4 | `pipeline_id` | `uuid` | não |  |  |  |
| 5 | `stage_id` | `uuid` | não |  |  |  |
| 6 | `status` | `deal_status` | sim | `'aberto'::deal_status` |  |  |
| 7 | `company_id` | `uuid` | não |  |  |  |
| 8 | `contact_id` | `uuid` | sim |  |  |  |
| 9 | `lead_id` | `uuid` | sim |  |  |  |
| 10 | `source_id` | `uuid` | sim |  |  |  |
| 11 | `valor` | `numeric(15,2)` | não | `0` |  |  |
| 12 | `valor_mensal_recorrente` | `numeric(15,2)` | sim |  |  |  |
| 13 | `desconto_percentual` | `numeric(5,2)` | sim | `0` |  |  |
| 14 | `desconto_valor` | `numeric(15,2)` | sim | `0` |  |  |
| 15 | `valor_final` | `numeric(15,2)` | sim |  |  |  |
| 16 | `probabilidade` | `integer` | sim | `0` |  |  |
| 17 | `valor_ponderado` | `numeric(15,2)` | sim |  |  |  |
| 18 | `data_previsao_fechamento` | `date` | sim |  |  |  |
| 19 | `data_fechamento` | `date` | sim |  |  |  |
| 20 | `owner_id` | `uuid` | não |  |  |  |
| 21 | `created_by_id` | `uuid` | sim |  |  |  |
| 22 | `loss_reason_id` | `uuid` | sim |  |  |  |
| 23 | `loss_reason_detalhe` | `text` | sim |  |  |  |
| 24 | `concorrente_vencedor` | `character varying(255)` | sim |  |  |  |
| 25 | `sla_expira_em` | `timestamp with time zone` | sim |  |  |  |
| 26 | `sla_status` | `character varying(20)` | sim | `'ok'::character varying` |  |  |
| 27 | `prioridade` | `priority_level` | sim | `'media'::priority_level` |  |  |
| 28 | `descricao` | `text` | sim |  |  |  |
| 29 | `proximos_passos` | `text` | sim |  |  |  |
| 30 | `observacoes` | `text` | sim |  |  |  |
| 31 | `tags_array` | `text[]` | sim | `'{}'::text[]` |  |  |
| 32 | `dados_extras` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 33 | `dias_no_pipeline` | `integer` | sim |  |  |  |
| 34 | `dias_no_estagio_atual` | `integer` | sim |  |  |  |
| 35 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 36 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 37 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deals_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| deals_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| deals_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| deals_lead_id_fkey | FOREIGN KEY | `FOREIGN KEY (lead_id) REFERENCES leads(id)` | NO ACTION | NO ACTION | sim |
| deals_loss_reason_id_fkey | FOREIGN KEY | `FOREIGN KEY (loss_reason_id) REFERENCES loss_reasons(id)` | NO ACTION | NO ACTION | sim |
| deals_pipeline_id_fkey | FOREIGN KEY | `FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)` | NO ACTION | NO ACTION | sim |
| deals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deals_probabilidade_check | CHECK | `CHECK (probabilidade >= 0 AND probabilidade <= 100)` |  |  | sim |
| deals_source_id_fkey | FOREIGN KEY | `FOREIGN KEY (source_id) REFERENCES lead_sources(id)` | NO ACTION | NO ACTION | sim |
| deals_stage_id_fkey | FOREIGN KEY | `FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deal_history | deal_history_deal_id_fkey | deal_id | CASCADE |
| _dormant.deal_products | deal_products_deal_id_fkey | deal_id | CASCADE |
| _dormant.tasks | tasks_deal_id_fkey | deal_id | CASCADE |
| _dormant.workflow_executions | workflow_executions_deal_id_fkey | deal_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deals_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX deals_codigo_key ON _dormant.deals USING btree (codigo)` |
| deals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deals_pkey ON _dormant.deals USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tr_deal_codigo | BEFORE | INSERT | ROW | enabled | public.gerar_codigo_deal |
| tr_deal_history | AFTER | UPDATE | ROW | enabled | public.registrar_deal_history |
| tr_deal_valor | BEFORE | INSERT OR UPDATE | ROW | enabled | public.calcular_valor_deal |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
