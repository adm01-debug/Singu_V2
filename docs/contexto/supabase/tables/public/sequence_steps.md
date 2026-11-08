# public.sequence_steps

> SINGU: Passos individuais de uma sequência. Ordem via step_number. Delay em dias+horas. Canal: email/whatsapp/sms/call/linkedin/task/wait.

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
| 2 | `sequence_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `step_number` | `integer` | não |  |  |  |
| 5 | `channel` | `text` | não |  |  |  |
| 6 | `delay_days` | `integer` | sim | `0` |  |  |
| 7 | `delay_hours` | `integer` | sim | `0` |  |  |
| 8 | `subject` | `text` | sim |  |  |  |
| 9 | `body` | `text` | sim |  |  |  |
| 10 | `template_id` | `uuid` | sim |  |  |  |
| 11 | `conditions` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `actions_on_complete` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 13 | `is_active` | `boolean` | sim | `true` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `step_order` | `integer` | não | `1` |  |  |
| 17 | `message_template` | `text` | sim |  |  |  |
| 18 | `notes` | `text` | sim |  |  |  |
| 19 | `condition_type` | `text` | não | `'always'::text` |  |  |
| 20 | `condition_wait_hours` | `integer` | não | `0` |  |  |
| 21 | `branch_on_yes_step` | `integer` | sim |  |  |  |
| 22 | `branch_on_no_step` | `integer` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sequence_steps_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text, 'call'::text, 'linkedin'::text, 'task'::text, 'wait'::text]))` |  |  | sim |
| sequence_steps_condition_type_contract_check | CHECK | `CHECK (condition_type = ANY (ARRAY['always'::text, 'if_opened'::text, 'if_clicked'::text, 'if_not_opened'::text, 'if_not_replied'::text, 'if_replied'::text]))` |  |  | sim |
| sequence_steps_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sequence_steps_sequence_id_fkey | FOREIGN KEY | `FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| unique_step_per_sequence | UNIQUE | `UNIQUE (sequence_id, step_number)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.sequence_email_reservations | sequence_email_reservations_step_id_fkey | step_id | RESTRICT |
| public.sequence_send_log | sequence_send_log_step_id_fkey | step_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sequence_steps_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_sequence_steps_user_id ON public.sequence_steps USING btree (user_id)` |
| sequence_steps_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sequence_steps_pkey ON public.sequence_steps USING btree (id)` |
| sequence_steps_sequence_id_step_order_key | btree | sequence_id, step_order | sim | sim |  | `CREATE UNIQUE INDEX sequence_steps_sequence_id_step_order_key ON public.sequence_steps USING btree (sequence_id, step_order)` |
| unique_step_per_sequence | btree | sequence_id, step_number | sim | sim |  | `CREATE UNIQUE INDEX unique_step_per_sequence ON public.sequence_steps USING btree (sequence_id, step_number)` |


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

### `Users manage own sequence steps`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM sequences s   WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM sequences s   WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_sequence_steps_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
