# public.call_logs

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
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `direction` | `text` | sim |  |  |  |
| 6 | `status` | `text` | sim |  |  |  |
| 7 | `duration_seconds` | `integer` | sim | `0` |  |  |
| 8 | `audio_url` | `text` | sim |  |  |  |
| 9 | `transcription` | `text` | sim |  |  |  |
| 10 | `sentiment` | `text` | sim |  |  |  |
| 11 | `summary` | `text` | sim |  |  |  |
| 12 | `external_id` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_logs_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_logs_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_logs_direction_check | CHECK | `CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))` |  |  | sim |
| call_logs_external_id_key | UNIQUE | `UNIQUE (external_id)` |  |  | sim |
| call_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| call_logs_status_check | CHECK | `CHECK (status = ANY (ARRAY['completed'::text, 'missed'::text, 'busy'::text, 'failed'::text, 'no-answer'::text]))` |  |  | sim |
| call_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_logs_external_id_key | btree | external_id | sim | sim |  | `CREATE UNIQUE INDEX call_logs_external_id_key ON public.call_logs USING btree (external_id)` |
| call_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_logs_pkey ON public.call_logs USING btree (id)` |


## Policies (RLS)

### `Users can manage their own call logs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_enqueue_bpr_calls | AFTER | INSERT | ROW | enabled | public.enqueue_behavioral_profile_regen |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
