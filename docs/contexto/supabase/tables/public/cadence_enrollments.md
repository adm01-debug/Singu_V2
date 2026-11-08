# public.cadence_enrollments

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
| 2 | `cadence_id` | `uuid` | sim |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `user_id` | `uuid` | não |  |  |  |
| 6 | `current_step` | `integer` | sim | `1` |  |  |
| 7 | `status` | `text` | sim | `'active'::text` |  |  |
| 8 | `next_action_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `enrolled_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `completed_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cadence_enrollments_cadence_id_company_id_key | UNIQUE | `UNIQUE (cadence_id, company_id)` |  |  | sim |
| cadence_enrollments_cadence_id_fkey | FOREIGN KEY | `FOREIGN KEY (cadence_id) REFERENCES sales_cadences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_enrollments_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_enrollments_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| cadence_enrollments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cadence_enrollments_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'replied'::text, 'bounced'::text, 'opted_out'::text]))` |  |  | sim |
| cadence_enrollments_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cadence_enrollments_cadence_id_company_id_key | btree | cadence_id, company_id | sim | sim |  | `CREATE UNIQUE INDEX cadence_enrollments_cadence_id_company_id_key ON public.cadence_enrollments USING btree (cadence_id, company_id)` |
| cadence_enrollments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cadence_enrollments_pkey ON public.cadence_enrollments USING btree (id)` |
| idx_cadence_enrollments_cadence_id | btree | cadence_id | não | sim |  | `CREATE INDEX idx_cadence_enrollments_cadence_id ON public.cadence_enrollments USING btree (cadence_id)` |
| idx_cadence_enrollments_company_id_fk | btree | company_id | não | sim |  | `CREATE INDEX idx_cadence_enrollments_company_id_fk ON public.cadence_enrollments USING btree (company_id)` |
| idx_cadence_enrollments_contact_id_fk | btree | contact_id | não | sim |  | `CREATE INDEX idx_cadence_enrollments_contact_id_fk ON public.cadence_enrollments USING btree (contact_id)` |
| idx_cadence_enrollments_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_cadence_enrollments_user_id ON public.cadence_enrollments USING btree (user_id)` |


## Policies (RLS)

### `cadence_enrollments_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `cadence_enrollments_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `cadence_enrollments_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `cadence_enrollments_update`

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

_nenhum_
