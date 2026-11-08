# _dormant.known_devices

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `device_fingerprint` | `text` | não |  |  |  |
| 4 | `device_name` | `text` | sim |  |  |  |
| 5 | `browser` | `text` | sim |  |  |  |
| 6 | `os` | `text` | sim |  |  |  |
| 7 | `is_trusted` | `boolean` | sim | `false` |  |  |
| 8 | `first_seen` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `last_seen` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| known_devices_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| known_devices_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| known_devices_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX known_devices_pkey ON _dormant.known_devices USING btree (id)` |


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
