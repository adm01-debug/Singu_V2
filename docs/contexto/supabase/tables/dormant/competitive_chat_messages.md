# _dormant.competitive_chat_messages

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
| 3 | `message` | `text` | não |  |  |  |
| 4 | `message_type` | `text` | não | `'chat'::text` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| competitive_chat_messages_message_type_check | CHECK | `CHECK (message_type = ANY (ARRAY['chat'::text, 'taunt'::text, 'celebration'::text, 'system'::text]))` |  |  | sim |
| competitive_chat_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| competitive_chat_messages_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| competitive_chat_messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX competitive_chat_messages_pkey ON _dormant.competitive_chat_messages USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
