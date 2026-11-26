# public.leads

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
| usada por views | public.vw_leads_full, public.vw_pipeline_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `codigo` | `character varying(20)` | sim |  |  |  |
| 3 | `pipeline_id` | `uuid` | não |  |  |  |
| 4 | `stage_id` | `uuid` | não |  |  |  |
| 5 | `status` | `lead_status` | sim | `'novo'::lead_status` |  |  |
| 6 | `company_id` | `uuid` | sim |  |  |  |
| 7 | `contact_id` | `uuid` | sim |  |  |  |
| 8 | `empresa_nome` | `character varying(255)` | sim |  |  |  |
| 9 | `empresa_cnpj` | `character varying(18)` | sim |  |  |  |
| 10 | `contato_nome` | `character varying(255)` | sim |  |  |  |
| 11 | `contato_email` | `character varying(255)` | sim |  |  |  |
| 12 | `contato_telefone` | `character varying(50)` | sim |  |  |  |
| 13 | `contato_cargo` | `character varying(100)` | sim |  |  |  |
| 14 | `source_id` | `uuid` | sim |  |  |  |
| 15 | `campanha` | `character varying(255)` | sim |  |  |  |
| 16 | `utm_source` | `character varying(100)` | sim |  |  |  |
| 17 | `utm_medium` | `character varying(100)` | sim |  |  |  |
| 18 | `utm_campaign` | `character varying(100)` | sim |  |  |  |
| 19 | `temperatura` | `character varying(20)` | sim | `'morno'::character varying` |  |  |
| 20 | `score` | `integer` | sim | `0` |  |  |
| 21 | `prioridade` | `priority_level` | sim | `'media'::priority_level` |  |  |
| 22 | `valor_estimado` | `numeric(15,2)` | sim |  |  |  |
| 23 | `owner_id` | `uuid` | sim |  |  |  |
| 24 | `created_by_id` | `uuid` | sim |  |  |  |
| 25 | `data_primeiro_contato` | `timestamp with time zone` | sim |  |  |  |
| 26 | `data_ultimo_contato` | `timestamp with time zone` | sim |  |  |  |
| 27 | `data_qualificacao` | `timestamp with time zone` | sim |  |  |  |
| 28 | `data_conversao` | `timestamp with time zone` | sim |  |  |  |
| 29 | `sla_expira_em` | `timestamp with time zone` | sim |  |  |  |
| 30 | `sla_status` | `character varying(20)` | sim | `'ok'::character varying` |  |  |
| 31 | `interesse` | `text` | sim |  |  |  |
| 32 | `observacoes` | `text` | sim |  |  |  |
| 33 | `tags_array` | `text[]` | sim | `'{}'::text[]` |  |  |
| 34 | `dados_extras` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 35 | `convertido_para_deal_id` | `uuid` | sim |  |  |  |
| 36 | `motivo_desqualificacao` | `text` | sim |  |  |  |
| 37 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 38 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 39 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| leads_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| leads_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| leads_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| leads_pipeline_id_fkey | FOREIGN KEY | `FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)` | NO ACTION | NO ACTION | sim |
| leads_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| leads_score_check | CHECK | `CHECK (score >= 0 AND score <= 100)` |  |  | sim |
| leads_source_id_fkey | FOREIGN KEY | `FOREIGN KEY (source_id) REFERENCES lead_sources(id)` | NO ACTION | NO ACTION | sim |
| leads_stage_id_fkey | FOREIGN KEY | `FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deals | deals_lead_id_fkey | lead_id | NO ACTION |
| _dormant.lead_history | lead_history_lead_id_fkey | lead_id | CASCADE |
| _dormant.tasks | tasks_lead_id_fkey | lead_id | CASCADE |
| _dormant.workflow_executions | workflow_executions_lead_id_fkey | lead_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| leads_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX leads_codigo_key ON public.leads USING btree (codigo)` |
| leads_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id)` |


## Policies (RLS)

### `leads_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((owner_id = ( SELECT auth.uid() AS uid)) OR (created_by_id = ( SELECT auth.uid() AS uid)))` |
| WITH CHECK | `((owner_id = ( SELECT auth.uid() AS uid)) OR (created_by_id = ( SELECT auth.uid() AS uid)))` |

### `service_role_full_leads`

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
| tr_lead_codigo | BEFORE | INSERT | ROW | enabled | public.gerar_codigo_lead |
| tr_lead_history | AFTER | UPDATE | ROW | enabled | public.registrar_lead_history |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
