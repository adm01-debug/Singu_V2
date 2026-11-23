# public.carriers

> Transportadoras vinculadas a companies (1:1 via company_id UNIQUE). 112 registros. Campos de qualificação: homologado, data_homologacao, score_geral (caches atualizados por triggers). Homologação: Logística (Thiago id=80). 5 critérios: pontualidade(30%), conservação(25%), preço_frete(20%), cobertura(15%), rastreamento(10%).

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_carrier_alerts, public.vw_carrier_by_state, public.vw_carrier_data_quality, public.vw_carrier_evaluations_history, public.vw_carrier_homologation_control, public.vw_carrier_homologation_queue, public.vw_carrier_qualification_dashboard, public.vw_carrier_ranking, public.vw_carriers, public.vw_carriers_completo |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `tipo_transporte` | `text` | sim |  |  |  |
| 4 | `grupo_economico` | `text` | sim |  |  |  |
| 5 | `estados_atendidos` | `text[]` | sim |  |  |  |
| 6 | `cidades_atendidas` | `text[]` | sim |  |  |  |
| 7 | `prazo_por_trecho` | `jsonb` | sim |  |  |  |
| 8 | `tipo_frete` | `text` | sim |  |  |  |
| 9 | `tabela_frete` | `jsonb` | sim |  |  |  |
| 10 | `transportadora_validada` | `boolean` | sim | `false` |  |  |
| 11 | `data_validacao` | `date` | sim |  |  |  |
| 12 | `ultimo_transporte` | `date` | sim |  |  |  |
| 13 | `observacoes` | `text` | sim |  |  |  |
| 14 | `spa_data` | `jsonb` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 17 | `homologado` | `boolean` | não | `false` |  | Flag de cache: true se última homologação está ativa e não vencida |
| 18 | `data_homologacao` | `date` | sim |  |  | Cache da data da última homologação aprovada |
| 19 | `score_geral` | `numeric(5,2)` | sim |  |  | Cache do score geral consolidado (0-100) |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| carriers_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| carriers_company_id_key | UNIQUE | `UNIQUE (company_id)` |  |  | sim |
| carriers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| carriers_score_geral_check | CHECK | `CHECK (score_geral >= 0::numeric AND score_geral <= 100::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.carrier_evaluations | carrier_evaluations_carrier_id_fkey | carrier_id | CASCADE |
| public.carrier_homologations | carrier_homologations_carrier_id_fkey | carrier_id | CASCADE |
| public.carrier_score_history | carrier_score_history_carrier_id_fkey | carrier_id | CASCADE |
| public.carrier_scores | carrier_scores_carrier_id_fkey | carrier_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| carriers_company_id_key | btree | company_id | sim | sim |  | `CREATE UNIQUE INDEX carriers_company_id_key ON public.carriers USING btree (company_id)` |
| carriers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX carriers_pkey ON public.carriers USING btree (id)` |
| idx_carriers_homologado | btree | homologado | não | sim |  | `CREATE INDEX idx_carriers_homologado ON public.carriers USING btree (homologado)` |
| idx_carriers_score_geral | btree | score_geral | não | sim |  | `CREATE INDEX idx_carriers_score_geral ON public.carriers USING btree (score_geral DESC NULLS LAST)` |


## Policies (RLS)

### `carriers_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = carriers.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = carriers.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_carriers_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
