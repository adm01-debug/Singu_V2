# _dormant.feed_reactions

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
| 2 | `feed_item_id` | `uuid` | não |  |  |  |
| 3 | `salesperson_id` | `uuid` | não |  |  |  |
| 4 | `reaction_type` | `text` | não | `'like'::text` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feed_reactions_feed_item_id_fkey | FOREIGN KEY | `FOREIGN KEY (feed_item_id) REFERENCES victory_feed(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| feed_reactions_feed_item_id_salesperson_id_key | UNIQUE | `UNIQUE (feed_item_id, salesperson_id)` |  |  | sim |
| feed_reactions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| feed_reactions_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feed_reactions_feed_item_id_salesperson_id_key | btree | feed_item_id, salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX feed_reactions_feed_item_id_salesperson_id_key ON _dormant.feed_reactions USING btree (feed_item_id, salesperson_id)` |
| feed_reactions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX feed_reactions_pkey ON _dormant.feed_reactions USING btree (id)` |


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
