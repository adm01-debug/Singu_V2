# _dormant.active_sessions

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `session_token` | `text` | sim |  |  |  |
| 4 | `ip_address` | `text` | sim |  |  |  |
| 5 | `user_agent` | `text` | sim |  |  |  |
| 6 | `device_info` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `last_activity` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `refresh_count` | `integer` | sim | `0` |  |  |
| 9 | `last_refresh_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `max_lifetime_hours` | `integer` | sim | `24` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `expires_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| active_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| active_sessions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| active_sessions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX active_sessions_pkey ON _dormant.active_sessions USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
