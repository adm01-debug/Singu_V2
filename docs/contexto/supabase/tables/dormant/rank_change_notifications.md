# _dormant.rank_change_notifications

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
| 2 | `salesperson_id` | `uuid` | não |  |  |  |
| 3 | `old_rank` | `integer` | não |  |  |  |
| 4 | `new_rank` | `integer` | não |  |  |  |
| 5 | `change_type` | `text` | não |  |  |  |
| 6 | `is_read` | `boolean` | não | `false` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rank_change_notifications_change_type_check | CHECK | `CHECK (change_type = ANY (ARRAY['up'::text, 'down'::text]))` |  |  | sim |
| rank_change_notifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rank_change_notifications_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rank_change_notifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rank_change_notifications_pkey ON _dormant.rank_change_notifications USING btree (id)` |


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
