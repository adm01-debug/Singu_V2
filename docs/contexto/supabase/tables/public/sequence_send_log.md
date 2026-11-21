# public.sequence_send_log

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
| 2 | `enrollment_id` | `uuid` | não |  |  |  |
| 3 | `step_id` | `uuid` | não |  |  |  |
| 4 | `sequence_id` | `uuid` | não |  |  |  |
| 5 | `contact_id` | `uuid` | não |  |  |  |
| 6 | `user_id` | `uuid` | não |  |  |  |
| 7 | `step_order` | `integer` | não |  |  |  |
| 8 | `channel` | `text` | não |  |  |  |
| 9 | `message_id` | `text` | sim |  |  |  |
| 10 | `tracking_token` | `text` | sim | `encode(gen_random_bytes(16), 'hex'::text)` |  |  |
| 11 | `status` | `text` | não | `'sent'::text` |  |  |
| 12 | `error_message` | `text` | sim |  |  |  |
| 13 | `opened_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `clicked_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `sent_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sequence_send_log_enrollment_id_fkey | FOREIGN KEY | `FOREIGN KEY (enrollment_id) REFERENCES sequence_enrollments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sequence_send_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sequence_send_log_sequence_id_fkey | FOREIGN KEY | `FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sequence_send_log_status_check | CHECK | `CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'skipped'::text, 'bounced'::text]))` |  |  | sim |
| sequence_send_log_step_id_fkey | FOREIGN KEY | `FOREIGN KEY (step_id) REFERENCES sequence_steps(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sequence_send_log_tracking_token_key | UNIQUE | `UNIQUE (tracking_token)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_seq_send_log_enrollment | btree | enrollment_id | não | sim |  | `CREATE INDEX idx_seq_send_log_enrollment ON public.sequence_send_log USING btree (enrollment_id)` |
| idx_seq_send_log_token | btree | tracking_token | não | sim |  | `CREATE INDEX idx_seq_send_log_token ON public.sequence_send_log USING btree (tracking_token)` |
| idx_seq_send_log_user | btree | user_id, sent_at | não | sim |  | `CREATE INDEX idx_seq_send_log_user ON public.sequence_send_log USING btree (user_id, sent_at DESC)` |
| sequence_send_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sequence_send_log_pkey ON public.sequence_send_log USING btree (id)` |
| sequence_send_log_tracking_token_key | btree | tracking_token | sim | sim |  | `CREATE UNIQUE INDEX sequence_send_log_tracking_token_key ON public.sequence_send_log USING btree (tracking_token)` |


## Policies (RLS)

### `Service role full access seq send log`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)` |
| WITH CHECK |  |

### `Users view own sequence send log`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
