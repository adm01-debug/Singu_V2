# public.scheduled_visits

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
| 2 | `company_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `visit_date` | `timestamp with time zone` | não |  |  |  |
| 5 | `visit_type` | `text` | sim | `'commercial'::text` |  |  |
| 6 | `duration_minutes` | `integer` | sim | `60` |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `address_id` | `uuid` | sim |  |  |  |
| 9 | `status` | `text` | sim | `'scheduled'::text` |  |  |
| 10 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `completion_notes` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_scheduled_visits_status | CHECK | `CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text, 'rescheduled'::text]))` |  |  | sim |
| scheduled_visits_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| scheduled_visits_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scheduled_visits_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scheduled_visits_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_scheduled_visits_company_id ON public.scheduled_visits USING btree (company_id)` |
| idx_scheduled_visits_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_scheduled_visits_user_id ON public.scheduled_visits USING btree (user_id)` |
| idx_visits_user_date | btree | user_id, visit_date | não | sim |  | `CREATE INDEX idx_visits_user_date ON public.scheduled_visits USING btree (user_id, visit_date)` |
| scheduled_visits_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scheduled_visits_pkey ON public.scheduled_visits USING btree (id)` |


## Policies (RLS)

### `scheduled_visits_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `scheduled_visits_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `scheduled_visits_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `scheduled_visits_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
