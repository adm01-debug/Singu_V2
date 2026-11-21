# public.ai_chat_threads

> SINGU: Threads do Ask CRM Chat (IA flutuante para consultar dados em linguagem natural via SQL gerado). Cada thread mantém contexto.

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | sim |  |  |  |
| 4 | `context_type` | `text` | sim | `'crm_data'::text` |  |  |
| 5 | `context_id` | `uuid` | sim |  |  |  |
| 6 | `model_used` | `text` | sim |  |  |  |
| 7 | `total_messages` | `integer` | sim | `0` |  |  |
| 8 | `total_tokens` | `integer` | sim | `0` |  |  |
| 9 | `is_archived` | `boolean` | sim | `false` |  |  |
| 10 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `last_message_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `context_entity_type` | `text` | sim |  |  |  |
| 15 | `context_entity_id` | `uuid` | sim |  |  |  |
| 16 | `pinned` | `boolean` | não | `false` |  |  |
| 17 | `archived` | `boolean` | não | `false` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_chat_threads_context_type_check | CHECK | `CHECK (context_type = ANY (ARRAY['crm_data'::text, 'contact'::text, 'company'::text, 'deal'::text, 'general'::text, 'custom'::text]))` |  |  | sim |
| ai_chat_threads_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_chat_threads_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ai_chat_threads_pkey ON public.ai_chat_threads USING btree (id)` |
| idx_ai_chat_threads_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_ai_chat_threads_user_id ON public.ai_chat_threads USING btree (user_id)` |


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

### `Users manage own threads`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_ai_chat_threads_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
