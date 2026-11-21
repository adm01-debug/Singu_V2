# public.nurturing_enrollments

> SINGU: Contatos em workflows de nurturing. Context carrega estado entre steps.

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
| 2 | `workflow_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | não |  |  |  |
| 5 | `status` | `text` | não | `'active'::text` |  |  |
| 6 | `current_step_index` | `integer` | sim | `0` |  |  |
| 7 | `context` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `enrolled_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `current_step` | `integer` | sim | `0` |  |  |
| 13 | `next_action_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nurturing_enrollments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| nurturing_enrollments_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text, 'failed'::text]))` |  |  | sim |
| uq_nurturing_enrollments_workflow_contact | UNIQUE | `UNIQUE (workflow_id, contact_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nurturing_enrollments_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_nurturing_enrollments_user_id ON public.nurturing_enrollments USING btree (user_id)` |
| nurturing_enrollments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nurturing_enrollments_pkey ON public.nurturing_enrollments USING btree (id)` |
| uq_nurturing_enrollments_workflow_contact | btree | workflow_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX uq_nurturing_enrollments_workflow_contact ON public.nurturing_enrollments USING btree (workflow_id, contact_id)` |


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

### `Users manage own nurturing enrollments`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_nurturing_enrollments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
