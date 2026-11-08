# public.sequence_email_reservations

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
| 1 | `contact_id` | `uuid` | não |  |  |  |
| 2 | `enrollment_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `step_id` | `uuid` | não |  |  |  |
| 5 | `current_step` | `integer` | não |  |  |  |
| 6 | `step_order` | `integer` | não |  |  |  |
| 7 | `idempotency_key` | `text` | sim | `((('seq-'::text \|\| (enrollment_id)::text) \|\| '-step-'::text) \|\| (step_order)::text)` | s |  |
| 8 | `token` | `uuid` | não |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sequence_email_reservations_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| sequence_email_reservations_current_step_check | CHECK | `CHECK (current_step >= 0)` |  |  | sim |
| sequence_email_reservations_enrollment_id_fkey | FOREIGN KEY | `FOREIGN KEY (enrollment_id) REFERENCES sequence_enrollments(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| sequence_email_reservations_enrollment_id_key | UNIQUE | `UNIQUE (enrollment_id)` |  |  | sim |
| sequence_email_reservations_pkey | PRIMARY KEY | `PRIMARY KEY (contact_id)` |  |  | sim |
| sequence_email_reservations_step_id_fkey | FOREIGN KEY | `FOREIGN KEY (step_id) REFERENCES sequence_steps(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| sequence_email_reservations_step_order_check | CHECK | `CHECK (step_order > 0)` |  |  | sim |
| sequence_email_reservations_token_key | UNIQUE | `UNIQUE (token)` |  |  | sim |
| sequence_email_reservations_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sequence_email_reservations_enrollment_id_key | btree | enrollment_id | sim | sim |  | `CREATE UNIQUE INDEX sequence_email_reservations_enrollment_id_key ON public.sequence_email_reservations USING btree (enrollment_id)` |
| sequence_email_reservations_pkey | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX sequence_email_reservations_pkey ON public.sequence_email_reservations USING btree (contact_id)` |
| sequence_email_reservations_token_key | btree | token | sim | sim |  | `CREATE UNIQUE INDEX sequence_email_reservations_token_key ON public.sequence_email_reservations USING btree (token)` |


## Policies (RLS)

### `sequence_email_reservation_owner`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
