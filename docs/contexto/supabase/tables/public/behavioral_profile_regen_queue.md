# public.behavioral_profile_regen_queue

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
| 1 | `contact_id` | `uuid` | não |  |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `enqueued_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `next_run_at` | `timestamp with time zone` | não | `(now() + '00:05:00'::interval)` |  |  |
| 5 | `attempts` | `integer` | não | `0` |  |  |
| 6 | `last_error` | `text` | sim |  |  |  |
| 7 | `last_processed_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `trigger_source` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `claim_token` | `uuid` | sim | `gen_random_uuid()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| behavioral_profile_regen_queue_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| behavioral_profile_regen_queue_pkey | PRIMARY KEY | `PRIMARY KEY (contact_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| behavioral_profile_regen_queue_pkey | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX behavioral_profile_regen_queue_pkey ON public.behavioral_profile_regen_queue USING btree (contact_id)` |
| idx_bpr_queue_next_run | btree | next_run_at | não | sim | `(attempts < 5)` | `CREATE INDEX idx_bpr_queue_next_run ON public.behavioral_profile_regen_queue USING btree (next_run_at) WHERE (attempts < 5)` |
| idx_bpr_queue_trigger_source | btree | trigger_source, updated_at | não | sim |  | `CREATE INDEX idx_bpr_queue_trigger_source ON public.behavioral_profile_regen_queue USING btree (trigger_source, updated_at DESC)` |
| idx_bpr_queue_updated_at_desc | btree | updated_at | não | sim |  | `CREATE INDEX idx_bpr_queue_updated_at_desc ON public.behavioral_profile_regen_queue USING btree (updated_at DESC)` |


## Policies (RLS)

### `Admins insert regen queue`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Admins read all regen queue`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins update regen queue`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Users read own queue items`

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
| trg_bpr_queue_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_bpr_queue_updated_at |


## Grants

_nenhum_
