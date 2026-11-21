# public.visit_checkins

> SINGU: Check-ins de visitas presenciais com GPS (lat/long/accuracy), duração computada, fotos e outcome. duration_minutes é computed.

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
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `checkin_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `checkout_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `duration_minutes` | `integer` | sim | ` CASE     WHEN (checkout_at IS NOT NULL) THEN ((EXTRACT(epoch FROM (checkout_at - checkin_at)))::integer / 60)     ELSE NULL::integer END` | s |  |
| 8 | `latitude` | `numeric(10,7)` | sim |  |  |  |
| 9 | `longitude` | `numeric(10,7)` | sim |  |  |  |
| 10 | `address` | `text` | sim |  |  |  |
| 11 | `accuracy_meters` | `numeric(6,2)` | sim |  |  |  |
| 12 | `purpose` | `text` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `outcome` | `text` | sim |  |  |  |
| 15 | `photos` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 16 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `photo_url` | `text` | sim |  |  |  |
| 20 | `visit_type` | `text` | sim | `'presencial'::text` |  |  |
| 21 | `check_in_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `check_out_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_visit_checkins_visit_type | CHECK | `CHECK (visit_type = ANY (ARRAY['presencial'::text, 'prospeccao'::text, 'suporte'::text, 'entrega'::text, 'outro'::text]))` |  |  | sim |
| visit_checkins_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| visit_checkins_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['successful'::text, 'rescheduled'::text, 'no_show'::text, 'partial'::text, 'cancelled'::text]))` |  |  | sim |
| visit_checkins_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_visit_checkins_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_visit_checkins_user_id ON public.visit_checkins USING btree (user_id)` |
| visit_checkins_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX visit_checkins_pkey ON public.visit_checkins USING btree (id)` |


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

### `Users manage own visit checkins`

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
| update_visit_checkins_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
