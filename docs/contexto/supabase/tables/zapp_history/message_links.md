# zapp_history.message_links

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
| usada por views | zapp_history.contact_message_stats, zapp_history.v_pipeline_pending |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `message_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `url` | `text` | não |  |  |  |
| 5 | `url_normalized` | `text` | sim |  |  | URL canonicalizada (lowercase host, sem utm_*, sem fragment). Usada para dedupe. |
| 6 | `url_hash` | `text` | sim |  |  | SHA256 da url_normalized para índice de dedupe rápido. |
| 7 | `domain` | `text` | sim |  |  |  |
| 8 | `scheme` | `text` | sim |  |  |  |
| 9 | `path` | `text` | sim |  |  |  |
| 10 | `title` | `text` | sim |  |  |  |
| 11 | `description` | `text` | sim |  |  |  |
| 12 | `image_url` | `text` | sim |  |  |  |
| 13 | `site_name` | `text` | sim |  |  |  |
| 14 | `og_type` | `text` | sim |  |  |  |
| 15 | `og_metadata` | `jsonb` | sim |  |  |  |
| 16 | `fetch_status` | `text` | não | `'pending'::text` |  | pending → fetching → done \| failed \| skipped \| blocked |
| 17 | `fetch_attempts` | `integer` | não | `0` |  |  |
| 18 | `fetched_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `fetch_error` | `text` | sim |  |  |  |
| 20 | `is_safe` | `boolean` | sim |  |  | NULL = não verificado. TRUE/FALSE após verificação de safe browsing. |
| 21 | `safety_check_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `is_shortened` | `boolean` | sim | `false` |  |  |
| 23 | `resolved_url` | `text` | sim |  |  |  |
| 24 | `link_category` | `text` | sim |  |  |  |
| 25 | `is_internal` | `boolean` | sim | `false` |  |  |
| 26 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 27 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 28 | `conversation_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_ml_attempts_positive | CHECK | `CHECK (fetch_attempts >= 0)` |  |  | sim |
| message_links_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| message_links_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES zapp_history.conversations(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| message_links_fetch_status_check | CHECK | `CHECK (fetch_status = ANY (ARRAY['pending'::text, 'fetching'::text, 'done'::text, 'failed'::text, 'skipped'::text, 'blocked'::text]))` |  |  | sim |
| message_links_message_id_fkey | FOREIGN KEY | `FOREIGN KEY (message_id) REFERENCES zapp_history.messages(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| message_links_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ml_contact | btree | contact_id, created_at | não | sim |  | `CREATE INDEX idx_ml_contact ON zapp_history.message_links USING btree (contact_id, created_at DESC)` |
| idx_ml_conversation | btree | conversation_id | não | sim |  | `CREATE INDEX idx_ml_conversation ON zapp_history.message_links USING btree (conversation_id)` |
| idx_ml_domain | btree | domain | não | sim |  | `CREATE INDEX idx_ml_domain ON zapp_history.message_links USING btree (domain)` |
| idx_ml_message | btree | message_id | não | sim |  | `CREATE INDEX idx_ml_message ON zapp_history.message_links USING btree (message_id)` |
| idx_ml_pending | btree | created_at | não | sim | `((fetch_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (fetch_attempts < 3))` | `CREATE INDEX idx_ml_pending ON zapp_history.message_links USING btree (created_at) WHERE ((fetch_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (fetch_attempts < 3))` |
| message_links_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX message_links_pkey ON zapp_history.message_links USING btree (id)` |


## Policies (RLS)

### `ml_read`

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
| trg_ml_autofill | BEFORE | INSERT | ROW | enabled | zapp_history.trg_autofill_contact_from_message |
| trg_ml_increment | AFTER | INSERT | ROW | enabled | zapp_history.trg_increment_link_count |
| trg_ml_updated_at | BEFORE | UPDATE | ROW | enabled | zapp_history.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
