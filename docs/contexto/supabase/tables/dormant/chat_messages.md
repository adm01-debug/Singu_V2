# _dormant.chat_messages

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
| 2 | `conversation_id` | `uuid` | não |  |  |  |
| 3 | `role` | `text` | não |  |  |  |
| 4 | `content` | `text` | não |  |  |  |
| 5 | `response_mode` | `text` | não | `'text'::text` |  |  |
| 6 | `voice_id` | `text` | sim | `'CwhRBWXzGAHq8TQ4Fs17'::text` |  |  |
| 7 | `voice_name` | `text` | sim | `'Roger'::text` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chat_messages_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| chat_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| chat_messages_response_mode_check | CHECK | `CHECK (response_mode = ANY (ARRAY['text'::text, 'audio'::text, 'both'::text]))` |  |  | sim |
| chat_messages_role_check | CHECK | `CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| chat_messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX chat_messages_pkey ON _dormant.chat_messages USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
