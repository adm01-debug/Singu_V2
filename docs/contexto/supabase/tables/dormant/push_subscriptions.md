# _dormant.push_subscriptions

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
| 3 | `endpoint` | `text` | não |  |  |  |
| 4 | `p256dh` | `text` | não |  |  |  |
| 5 | `auth` | `text` | não |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| push_subscriptions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| push_subscriptions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| push_subscriptions_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| push_subscriptions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX push_subscriptions_pkey ON _dormant.push_subscriptions USING btree (id)` |
| push_subscriptions_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX push_subscriptions_user_id_key ON _dormant.push_subscriptions USING btree (user_id)` |


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
