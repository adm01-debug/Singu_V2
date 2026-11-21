# public.ai_chat_messages

> SINGU: Mensagens do Ask CRM Chat. Role user/assistant/system/tool. Mensagens assistant podem carregar generated_sql + query_result para auditoria.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `thread_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `role` | `text` | não |  |  |  |
| 5 | `content` | `text` | não |  |  |  |
| 6 | `generated_sql` | `text` | sim |  |  |  |
| 7 | `query_result` | `jsonb` | sim |  |  |  |
| 8 | `tokens_used` | `integer` | sim |  |  |  |
| 9 | `latency_ms` | `integer` | sim |  |  |  |
| 10 | `model` | `text` | sim |  |  |  |
| 11 | `tool_calls` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 12 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_chat_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ai_chat_messages_role_check | CHECK | `CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text, 'function'::text, 'tool'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_chat_messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ai_chat_messages_pkey ON public.ai_chat_messages USING btree (id)` |
| idx_ai_chat_messages_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_ai_chat_messages_user_id ON public.ai_chat_messages USING btree (user_id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users manage own messages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
