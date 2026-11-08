# _dormant.api_usage_log

> SINGU: Log de consumo de APIs externas

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `api_name` | `text` | não |  |  |  |
| 4 | `endpoint` | `text` | sim |  |  |  |
| 5 | `request_method` | `text` | sim |  |  |  |
| 6 | `request_size_bytes` | `integer` | sim |  |  |  |
| 7 | `response_status` | `integer` | sim |  |  |  |
| 8 | `response_size_bytes` | `integer` | sim |  |  |  |
| 9 | `response_time_ms` | `integer` | sim |  |  |  |
| 10 | `tokens_used` | `integer` | sim |  |  |  |
| 11 | `cost_usd` | `numeric(10,6)` | sim |  |  |  |
| 12 | `context_type` | `text` | sim |  |  |  |
| 13 | `context_id` | `uuid` | sim |  |  |  |
| 14 | `error_message` | `text` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| api_usage_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| api_usage_log_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| api_usage_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX api_usage_log_pkey ON _dormant.api_usage_log USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_api_usage_log`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
