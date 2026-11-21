# public.deal_room_milestones

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
| 2 | `room_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `due_date` | `date` | sim |  |  |  |
| 7 | `status` | `text` | não | `'pending'::text` |  |  |
| 8 | `owner_side` | `text` | não | `'both'::text` |  |  |
| 9 | `sort_order` | `integer` | não | `0` |  |  |
| 10 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `completed_by_side` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_room_milestones_completed_by_side_check | CHECK | `CHECK (completed_by_side = ANY (ARRAY['seller'::text, 'buyer'::text]))` |  |  | sim |
| deal_room_milestones_owner_side_check | CHECK | `CHECK (owner_side = ANY (ARRAY['seller'::text, 'buyer'::text, 'both'::text]))` |  |  | sim |
| deal_room_milestones_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_room_milestones_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'done'::text, 'blocked'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_room_milestones_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_room_milestones_pkey ON public.deal_room_milestones USING btree (id)` |
| idx_dr_milestones_room | btree | room_id, sort_order | não | sim |  | `CREATE INDEX idx_dr_milestones_room ON public.deal_room_milestones USING btree (room_id, sort_order)` |
| idx_dr_milestones_user | btree | user_id | não | sim |  | `CREATE INDEX idx_dr_milestones_user ON public.deal_room_milestones USING btree (user_id)` |


## Policies (RLS)

### `owner_all_ms`

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
| tr_dr_ms_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| tr_dr_ms_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
