# _dormant.whatsapp_messages

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `instance_name` | `text` | não |  |  |  |
| 5 | `remote_jid` | `text` | não |  |  |  |
| 6 | `message_id` | `text` | sim |  |  |  |
| 7 | `from_me` | `boolean` | não | `false` |  |  |
| 8 | `message_type` | `text` | não | `'text'::text` |  |  |
| 9 | `content` | `text` | sim |  |  |  |
| 10 | `media_url` | `text` | sim |  |  |  |
| 11 | `media_mimetype` | `text` | sim |  |  |  |
| 12 | `status` | `text` | sim | `'pending'::text` |  |  |
| 13 | `sender_name` | `text` | sim |  |  |  |
| 14 | `quoted_message_id` | `text` | sim |  |  |  |
| 15 | `timestamp` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `delivered_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `played_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 20 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| whatsapp_messages_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| whatsapp_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_whatsapp_messages_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_whatsapp_messages_user_contact ON _dormant.whatsapp_messages USING btree (user_id, contact_id)` |
| whatsapp_messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_messages_pkey ON _dormant.whatsapp_messages USING btree (id)` |


## Policies (RLS)

### `Users can manage their own whatsapp_messages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_whatsapp_messages | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
