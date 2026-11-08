# _dormant.rate_limit_settings

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `action` | `text` | não |  |  |  |
| 3 | `max_requests` | `integer` | não | `100` |  |  |
| 4 | `window_seconds` | `integer` | não | `3600` |  |  |
| 5 | `block_duration_seconds` | `integer` | não | `3600` |  |  |
| 6 | `is_active` | `boolean` | sim | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rate_limit_settings_action_key | UNIQUE | `UNIQUE (action)` |  |  | sim |
| rate_limit_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rate_limit_settings_action_key | btree | action | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_settings_action_key ON _dormant.rate_limit_settings USING btree (action)` |
| rate_limit_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_settings_pkey ON _dormant.rate_limit_settings USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
