# public.contact_next_actions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `action` | `text` | não |  |  |  |
| 5 | `reason` | `text` | não |  |  |  |
| 6 | `channel` | `text` | não |  |  |  |
| 7 | `urgency` | `text` | não | `'medium'::text` |  |  |
| 8 | `suggested_script` | `text` | sim |  |  |  |
| 9 | `expected_outcome` | `text` | sim |  |  |  |
| 10 | `signals_snapshot` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 11 | `model` | `text` | sim |  |  |  |
| 12 | `generated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `suggested_date` | `timestamp with time zone` | sim |  |  |  |
| 16 | `script_context` | `jsonb` | sim |  |  |  |
| 17 | `status` | `text` | sim | `'pending'::text` |  |  |
| 18 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `completion_notes` | `text` | sim |  |  |  |
| 20 | `edited_script` | `text` | sim |  |  |  |
| 21 | `contextual_tone` | `text` | sim |  |  |  |
| 22 | `completion_date` | `timestamp with time zone` | sim |  |  |  |
| 23 | `was_successful` | `boolean` | sim | `true` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_next_actions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_next_actions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_next_actions_urgency_check | CHECK | `CHECK (urgency = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))` |  |  | sim |
| contact_next_actions_user_id_contact_id_key | UNIQUE | `UNIQUE (user_id, contact_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_next_actions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_next_actions_pkey ON public.contact_next_actions USING btree (id)` |
| contact_next_actions_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_next_actions_user_id_contact_id_key ON public.contact_next_actions USING btree (user_id, contact_id)` |
| idx_cna_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_cna_contact_id ON public.contact_next_actions USING btree (contact_id)` |
| idx_contact_next_actions_generated_at | btree | user_id, generated_at | não | sim |  | `CREATE INDEX idx_contact_next_actions_generated_at ON public.contact_next_actions USING btree (user_id, generated_at DESC)` |
| idx_contact_next_actions_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_contact_next_actions_user_contact ON public.contact_next_actions USING btree (user_id, contact_id)` |


## Policies (RLS)

### `Users can delete their own next actions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own next actions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own next actions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own next actions`

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
| trg_notify_critical_next_action | AFTER | INSERT OR UPDATE | ROW | enabled | public.notify_critical_next_action |
| update_contact_next_actions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
