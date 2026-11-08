# public.closing_score_config

> Configuração dos fatores que compõem o score de fechamento

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `factor_name` | `character varying(100)` | não |  |  |  |
| 3 | `factor_description` | `text` | sim |  |  |  |
| 4 | `weight` | `numeric(5,2)` | não | `1.0` |  |  |
| 5 | `min_value` | `numeric(10,2)` | sim | `0` |  |  |
| 6 | `max_value` | `numeric(10,2)` | sim | `100` |  |  |
| 7 | `calculation_formula` | `text` | sim |  |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| closing_score_config_factor_name_key | UNIQUE | `UNIQUE (factor_name)` |  |  | sim |
| closing_score_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| closing_score_config_factor_name_key | btree | factor_name | sim | sim |  | `CREATE UNIQUE INDEX closing_score_config_factor_name_key ON public.closing_score_config USING btree (factor_name)` |
| closing_score_config_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX closing_score_config_pkey ON public.closing_score_config USING btree (id)` |


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
| update_closing_score_config_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
