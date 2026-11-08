# public.sales_scripts

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
| usada por views | public.vw_recommended_scripts |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `script_name` | `character varying(255)` | não |  |  |  |
| 3 | `script_code` | `character varying(50)` | sim |  |  |  |
| 4 | `script_type` | `character varying(50)` | sim |  |  |  |
| 5 | `stage` | `character varying(50)` | sim |  |  |  |
| 6 | `channel` | `character varying(50)` | sim |  |  |  |
| 7 | `description` | `text` | sim |  |  |  |
| 8 | `objective` | `text` | sim |  |  |  |
| 9 | `estimated_duration_minutes` | `integer` | sim |  |  |  |
| 10 | `prerequisites` | `text[]` | sim |  |  |  |
| 11 | `success_rate` | `numeric(5,2)` | sim |  |  |  |
| 12 | `times_used` | `integer` | sim | `0` |  |  |
| 13 | `recommended_disc_types` | `character varying(10)[]` | sim |  |  |  |
| 14 | `is_active` | `boolean` | sim | `true` |  |  |
| 15 | `is_template` | `boolean` | sim | `true` |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_scripts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_scripts_script_code_key | UNIQUE | `UNIQUE (script_code)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.script_usage_log | script_usage_log_script_id_fkey | script_id | NO ACTION |
| public.script_sections | script_sections_script_id_fkey | script_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sales_scripts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_scripts_pkey ON public.sales_scripts USING btree (id)` |
| sales_scripts_script_code_key | btree | script_code | sim | sim |  | `CREATE UNIQUE INDEX sales_scripts_script_code_key ON public.sales_scripts USING btree (script_code)` |


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


## Grants

_nenhum_
