# zapp_history.message_media

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | full |
| vem de extensão | não |
| usada por views | zapp_history.contact_message_stats, zapp_history.v_dashboard_atendimento, zapp_history.v_pipeline_pending |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `message_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `conversation_id` | `uuid` | sim |  |  |  |
| 5 | `media_type` | `text` | não |  |  |  |
| 6 | `storage_bucket` | `text` | não | `'whatsapp-media'::text` |  |  |
| 7 | `storage_path` | `text` | não |  |  | Path no bucket: contacts/{contact_id}/{YYYY}/{MM}/{type}/{message_id}_{uuid}.{ext} |
| 8 | `thumbnail_path` | `text` | sim |  |  |  |
| 9 | `file_name` | `text` | sim |  |  |  |
| 10 | `file_size_bytes` | `bigint` | sim |  |  |  |
| 11 | `mime_type` | `text` | sim |  |  |  |
| 12 | `file_extension` | `text` | sim |  |  |  |
| 13 | `hash_sha256` | `text` | sim |  |  | SHA256 do binário. Usado para dedupe entre conversas (mesmo arquivo enviado para múltiplos contatos). |
| 14 | `width` | `integer` | sim |  |  |  |
| 15 | `height` | `integer` | sim |  |  |  |
| 16 | `duration_seconds` | `integer` | sim |  |  |  |
| 17 | `caption` | `text` | sim |  |  |  |
| 18 | `alt_text` | `text` | sim |  |  |  |
| 19 | `detected_objects` | `jsonb` | sim |  |  |  |
| 20 | `ocr_text` | `text` | sim |  |  |  |
| 21 | `whatsapp_media_id` | `text` | sim |  |  |  |
| 22 | `evolution_message_id` | `text` | sim |  |  |  |
| 23 | `download_status` | `text` | não | `'pending'::text` |  | pending → downloading → downloaded \| failed \| expired |
| 24 | `download_attempts` | `integer` | não | `0` |  | Cresce em cada tentativa. Vira expired em attempts >= 5. |
| 25 | `download_error` | `text` | sim |  |  |  |
| 26 | `downloaded_at` | `timestamp with time zone` | sim |  |  |  |
| 27 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 28 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_mm_attempts_positive | CHECK | `CHECK (download_attempts >= 0)` |  |  | sim |
| chk_mm_file_size_positive | CHECK | `CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)` |  |  | sim |
| message_media_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| message_media_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES zapp_history.conversations(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| message_media_download_status_check | CHECK | `CHECK (download_status = ANY (ARRAY['pending'::text, 'downloading'::text, 'downloaded'::text, 'failed'::text, 'expired'::text]))` |  |  | sim |
| message_media_media_type_check | CHECK | `CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text, 'document'::text, 'sticker'::text]))` |  |  | sim |
| message_media_message_id_fkey | FOREIGN KEY | `FOREIGN KEY (message_id) REFERENCES zapp_history.messages(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| message_media_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_media_conv | btree | conversation_id | não | sim |  | `CREATE INDEX idx_media_conv ON zapp_history.message_media USING btree (conversation_id)` |
| idx_mm_contact_created | btree | contact_id, created_at | não | sim |  | `CREATE INDEX idx_mm_contact_created ON zapp_history.message_media USING btree (contact_id, created_at DESC)` |
| idx_mm_message | btree | message_id | não | sim |  | `CREATE INDEX idx_mm_message ON zapp_history.message_media USING btree (message_id)` |
| idx_mm_pending_download | btree | created_at | não | sim | `((download_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (download_attempts < 5))` | `CREATE INDEX idx_mm_pending_download ON zapp_history.message_media USING btree (created_at) WHERE ((download_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (download_attempts < 5))` |
| idx_mm_type | btree | media_type, created_at | não | sim |  | `CREATE INDEX idx_mm_type ON zapp_history.message_media USING btree (media_type, created_at DESC)` |
| message_media_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX message_media_pkey ON zapp_history.message_media USING btree (id)` |


## Policies (RLS)

### `mm_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `zapp_history.user_can_access_contact(contact_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_mm_autofill | BEFORE | INSERT | ROW | enabled | zapp_history.trg_autofill_contact_from_message |
| trg_mm_set_flag | AFTER | INSERT | ROW | enabled | zapp_history.trg_set_has_media |
| trg_mm_updated_at | BEFORE | UPDATE | ROW | enabled | zapp_history.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
