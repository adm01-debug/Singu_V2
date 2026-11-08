# public.sequences

> SINGU: Sequências (cadências) multi-canal de contato. Mãe dos steps individuais em sequence_steps.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `sequence_type` | `text` | não | `'outbound'::text` |  |  |
| 6 | `is_active` | `boolean` | sim | `true` |  |  |
| 7 | `pause_on_reply` | `boolean` | sim | `true` |  |  |
| 8 | `pause_on_meeting_booked` | `boolean` | sim | `true` |  |  |
| 9 | `total_steps` | `integer` | sim | `0` |  |  |
| 10 | `total_enrolled` | `integer` | sim | `0` |  |  |
| 11 | `completion_rate` | `numeric(5,2)` | sim |  |  |  |
| 12 | `reply_rate` | `numeric(5,2)` | sim |  |  |  |
| 13 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `status` | `text` | não | `'draft'::text` |  |  |
| 17 | `pause_on_meeting` | `boolean` | não | `false` |  |  |
| 18 | `max_enrollments` | `integer` | sim | `100` |  |  |
| 19 | `total_completed` | `integer` | não | `0` |  |  |
| 20 | `total_replied` | `integer` | não | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_sequences_status | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'archived'::text]))` |  |  | sim |
| sequences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sequences_sequence_type_check | CHECK | `CHECK (sequence_type = ANY (ARRAY['outbound'::text, 'inbound'::text, 'reengagement'::text, 'onboarding'::text, 'custom'::text]))` |  |  | sim |
| sequences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.sequence_enrollments | sequence_enrollments_sequence_id_fkey | sequence_id | CASCADE |
| public.sequence_events | sequence_events_sequence_id_fkey | sequence_id | CASCADE |
| public.sequence_send_log | sequence_send_log_sequence_id_fkey | sequence_id | CASCADE |
| public.sequence_steps | sequence_steps_sequence_id_fkey | sequence_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sequences_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_sequences_user_id ON public.sequences USING btree (user_id)` |
| sequences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sequences_pkey ON public.sequences USING btree (id)` |


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

### `Users manage own sequences`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| sequence_status_send_guard | BEFORE | UPDATE | ROW | enabled | public.guard_sequence_status_while_send |
| update_sequences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
