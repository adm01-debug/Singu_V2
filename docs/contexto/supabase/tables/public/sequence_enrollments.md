# public.sequence_enrollments

> SINGU: Matrículas de contatos em sequências. Pause automático on reply / on meeting_booked. 1 por contato por sequência (unique).

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
| 2 | `sequence_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | não |  |  |  |
| 5 | `status` | `text` | não | `'active'::text` |  |  |
| 6 | `current_step` | `integer` | não | `0` |  |  |
| 7 | `next_step_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `enrolled_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `paused_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `paused_reason` | `text` | sim |  |  |  |
| 12 | `last_step_completed_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `reply_detected_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `next_action_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `replied_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `last_step_executed_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sequence_enrollments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sequence_enrollments_sequence_id_fkey | FOREIGN KEY | `FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sequence_enrollments_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text, 'failed'::text, 'replied'::text, 'meeting_booked'::text]))` |  |  | sim |
| unique_enrollment | UNIQUE | `UNIQUE (sequence_id, contact_id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.sequence_email_reservations | sequence_email_reservations_enrollment_id_fkey | enrollment_id | RESTRICT |
| public.sequence_events | sequence_events_enrollment_id_fkey | enrollment_id | CASCADE |
| public.sequence_send_log | sequence_send_log_enrollment_id_fkey | enrollment_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sequence_enrollments_contact_active | btree | contact_id, user_id, status | não | sim | `(status = 'active'::text)` | `CREATE INDEX idx_sequence_enrollments_contact_active ON public.sequence_enrollments USING btree (contact_id, user_id, status) WHERE (status = 'active'::text)` |
| idx_sequence_enrollments_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_sequence_enrollments_user_id ON public.sequence_enrollments USING btree (user_id)` |
| sequence_enrollments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sequence_enrollments_pkey ON public.sequence_enrollments USING btree (id)` |
| unique_enrollment | btree | sequence_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX unique_enrollment ON public.sequence_enrollments USING btree (sequence_id, contact_id)` |


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

### `Users manage own enrollments`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `singu_sequence_enrollment_scope`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | authenticated |
| USING | `((user_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM sequences s   WHERE ((s.id = sequence_enrollments.sequence_id) AND (s.user_id = auth.uid())))) AND (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = sequence_enrollments.contact_id) AND (c.user_id = auth.uid())))))` |
| WITH CHECK | `((user_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM sequences s   WHERE ((s.id = sequence_enrollments.sequence_id) AND (s.user_id = auth.uid())))) AND (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = sequence_enrollments.contact_id) AND (c.user_id = auth.uid())))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| sequence_email_reservation_settle | AFTER | UPDATE | ROW | enabled | public.settle_sequence_email_reservation |
| sequence_enrollment_counter | AFTER | INSERT OR DELETE | ROW | enabled | public.refresh_sequence_enrollment_count |
| sequence_enrollment_write_guard | BEFORE | INSERT OR UPDATE | ROW | enabled | public.guard_sequence_enrollment_write |
| update_sequence_enrollments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
