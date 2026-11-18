# public.whatsapp_messages

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `company_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `direction` | `text` | não |  |  |  |
| 5 | `message_type` | `text` | sim | `'text'::text` |  |  |
| 6 | `content` | `text` | sim |  |  |  |
| 7 | `media_url` | `text` | sim |  |  |  |
| 8 | `whatsapp_id` | `text` | sim |  |  |  |
| 9 | `status` | `text` | sim | `'pending'::text` |  |  |
| 10 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `delivered_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `user_id` | `uuid` | sim |  |  |  |
| 16 | `instance_name` | `text` | sim |  |  |  |
| 17 | `remote_jid` | `text` | sim |  |  |  |
| 18 | `message_id` | `text` | sim |  |  |  |
| 19 | `from_me` | `boolean` | não | `false` |  |  |
| 20 | `media_mimetype` | `text` | sim |  |  |  |
| 21 | `sender_name` | `text` | sim |  |  |  |
| 22 | `quoted_message_id` | `text` | sim |  |  |  |
| 23 | `timestamp` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `played_at` | `timestamp with time zone` | sim |  |  |  |
| 25 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| whatsapp_messages_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| whatsapp_messages_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| whatsapp_messages_direction_check | CHECK | `CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))` |  |  | sim |
| whatsapp_messages_message_type_check | CHECK | `CHECK (message_type = ANY (ARRAY['text'::text, 'image'::text, 'audio'::text, 'video'::text, 'document'::text, 'location'::text, 'contact'::text, 'sticker'::text]))` |  |  | sim |
| whatsapp_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| whatsapp_messages_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'read'::text, 'failed'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_whatsapp_messages_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_whatsapp_messages_company_id ON public.whatsapp_messages USING btree (company_id)` |
| idx_whatsapp_messages_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_whatsapp_messages_contact_id ON public.whatsapp_messages USING btree (contact_id)` |
| idx_whatsapp_messages_instance | btree | instance_name | não | sim |  | `CREATE INDEX idx_whatsapp_messages_instance ON public.whatsapp_messages USING btree (instance_name)` |
| idx_whatsapp_messages_msg_id | btree | message_id | não | sim |  | `CREATE INDEX idx_whatsapp_messages_msg_id ON public.whatsapp_messages USING btree (message_id)` |
| idx_whatsapp_messages_remote_jid | btree | remote_jid | não | sim |  | `CREATE INDEX idx_whatsapp_messages_remote_jid ON public.whatsapp_messages USING btree (remote_jid)` |
| idx_whatsapp_messages_timestamp | btree | timestamp | não | sim |  | `CREATE INDEX idx_whatsapp_messages_timestamp ON public.whatsapp_messages USING btree ("timestamp" DESC)` |
| idx_whatsapp_messages_user_company_ts | btree | user_id, company_id, timestamp | não | sim |  | `CREATE INDEX idx_whatsapp_messages_user_company_ts ON public.whatsapp_messages USING btree (user_id, company_id, "timestamp" DESC)` |
| idx_whatsapp_messages_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_whatsapp_messages_user_contact ON public.whatsapp_messages USING btree (user_id, contact_id)` |
| idx_whatsapp_messages_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_whatsapp_messages_user_id ON public.whatsapp_messages USING btree (user_id)` |
| whatsapp_messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_messages_pkey ON public.whatsapp_messages USING btree (id)` |


## Policies (RLS)

### `Users can manage their own whatsapp messages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can manage their own whatsapp_messages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `whatsapp_messages_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `whatsapp_messages_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `whatsapp_messages_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `whatsapp_messages_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_whatsapp_messages | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_enqueue_bpr_whatsapp | AFTER | INSERT | ROW | enabled | public.enqueue_behavioral_profile_regen |
| trg_whatsapp_messages_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
