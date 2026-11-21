# public.sequence_events

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `enrollment_id` | `uuid` | não |  |  |  |
| 3 | `sequence_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | não |  |  |  |
| 5 | `user_id` | `uuid` | não |  |  |  |
| 6 | `step_order` | `integer` | sim |  |  |  |
| 7 | `event_type` | `text` | não |  |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sequence_events_enrollment_id_fkey | FOREIGN KEY | `FOREIGN KEY (enrollment_id) REFERENCES sequence_enrollments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sequence_events_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'replied'::text, 'bounced'::text, 'unsubscribed'::text, 'visited_page'::text, 'meeting_booked'::text, 'failed'::text, 'manual_completed'::text, 'email_resumed'::text]))` |  |  | sim |
| sequence_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sequence_events_sequence_id_fkey | FOREIGN KEY | `FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_seq_events_contact | btree | contact_id, event_type | não | sim |  | `CREATE INDEX idx_seq_events_contact ON public.sequence_events USING btree (contact_id, event_type)` |
| idx_seq_events_enrollment | btree | enrollment_id, created_at | não | sim |  | `CREATE INDEX idx_seq_events_enrollment ON public.sequence_events USING btree (enrollment_id, created_at DESC)` |
| idx_seq_events_user | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_seq_events_user ON public.sequence_events USING btree (user_id, created_at DESC)` |
| sequence_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sequence_events_pkey ON public.sequence_events USING btree (id)` |


## Policies (RLS)

### `Service role full access seq events`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)` |
| WITH CHECK |  |

### `Users insert own sequence events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users view own sequence events`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tg_sequence_events_to_intent | AFTER | INSERT | ROW | enabled | public.sequence_event_to_intent_signal |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
