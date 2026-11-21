# public.lead_score_recompute_queue

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `reason` | `text` | não | `'manual'::text` |  |  |
| 5 | `enqueued_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `processed_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_score_recompute_queue_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lead_score_queue_pending | btree | enqueued_at | não | sim | `(processed_at IS NULL)` | `CREATE INDEX idx_lead_score_queue_pending ON public.lead_score_recompute_queue USING btree (enqueued_at) WHERE (processed_at IS NULL)` |
| idx_lead_score_queue_user_contact | btree | user_id, contact_id | não | sim | `(processed_at IS NULL)` | `CREATE INDEX idx_lead_score_queue_user_contact ON public.lead_score_recompute_queue USING btree (user_id, contact_id) WHERE (processed_at IS NULL)` |
| lead_score_recompute_queue_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_score_recompute_queue_pkey ON public.lead_score_recompute_queue USING btree (id)` |


## Policies (RLS)

### `lead_score_queue_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `lead_score_queue_select_own`

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
