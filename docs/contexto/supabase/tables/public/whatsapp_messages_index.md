# public.whatsapp_messages_index

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `message_sid` | `text` | sim |  |  |  |
| 4 | `content` | `text` | sim |  |  |  |
| 5 | `message_type` | `text` | sim |  |  |  |
| 6 | `transcription` | `text` | sim |  |  |  |
| 7 | `sentiment` | `text` | sim |  |  |  |
| 8 | `intent` | `text` | sim |  |  |  |
| 9 | `neuro_tags` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 10 | `received_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| whatsapp_messages_index_message_sid_key | UNIQUE | `UNIQUE (message_sid)` |  |  | sim |
| whatsapp_messages_index_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| whatsapp_messages_index_message_sid_key | btree | message_sid | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_messages_index_message_sid_key ON public.whatsapp_messages_index USING btree (message_sid)` |
| whatsapp_messages_index_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_messages_index_pkey ON public.whatsapp_messages_index USING btree (id)` |


## Policies (RLS)

### `Owner or admin can insert whatsapp messages index`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Owner or admin can view whatsapp messages index`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
