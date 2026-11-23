# public.carrier_qualification_config

> Segmentos de classificação de transportadoras (Excelente a Crítico) com faixas de score e ações recomendadas

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
| usada por views | public.vw_carrier_ranking |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `segment_code` | `text` | não |  |  |  |
| 3 | `name_pt` | `text` | não |  |  |  |
| 4 | `description_pt` | `text` | sim |  |  |  |
| 5 | `score_min` | `numeric(5,2)` | não |  |  |  |
| 6 | `score_max` | `numeric(5,2)` | não |  |  |  |
| 7 | `color` | `text` | sim |  |  |  |
| 8 | `icon` | `text` | sim |  |  |  |
| 9 | `priority` | `integer` | não |  |  |  |
| 10 | `recommended_actions_pt` | `text[]` | sim |  |  |  |
| 11 | `is_active` | `boolean` | não | `true` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| carrier_qualification_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| carrier_qualification_config_segment_code_key | UNIQUE | `UNIQUE (segment_code)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.carrier_scores | carrier_scores_segment_code_fkey | segment_code | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| carrier_qualification_config_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX carrier_qualification_config_pkey ON public.carrier_qualification_config USING btree (id)` |
| carrier_qualification_config_segment_code_key | btree | segment_code | sim | sim |  | `CREATE UNIQUE INDEX carrier_qualification_config_segment_code_key ON public.carrier_qualification_config USING btree (segment_code)` |


## Policies (RLS)

### `carrier_qualification_config_admin_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `carrier_qualification_config_authenticated_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_carrier_qualification_config_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_protect_carrier_qualification_config_delete | BEFORE | DELETE | ROW | enabled | public.trg_fn_protect_carrier_qualification_config |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
