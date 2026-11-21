# public.meetings

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
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `deal_id` | `uuid` | sim |  |  |  |
| 5 | `user_id` | `uuid` | não |  |  |  |
| 6 | `title` | `text` | não |  |  |  |
| 7 | `description` | `text` | sim |  |  |  |
| 8 | `meeting_type` | `text` | sim | `'call'::text` |  |  |
| 9 | `scheduled_at` | `timestamp with time zone` | não |  |  |  |
| 10 | `duration_minutes` | `integer` | sim | `30` |  |  |
| 11 | `status` | `text` | sim | `'scheduled'::text` |  |  |
| 12 | `meeting_url` | `text` | sim |  |  |  |
| 13 | `location` | `text` | sim |  |  |  |
| 14 | `notes` | `text` | sim |  |  |  |
| 15 | `outcome` | `text` | sim |  |  |  |
| 16 | `attendees` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 17 | `reminders` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 18 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| meetings_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| meetings_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| meetings_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| meetings_meeting_type_check | CHECK | `CHECK (meeting_type = ANY (ARRAY['call'::text, 'video'::text, 'presencial'::text]))` |  |  | sim |
| meetings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| meetings_status_check | CHECK | `CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]))` |  |  | sim |
| meetings_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_meetings_company | btree | company_id | não | sim |  | `CREATE INDEX idx_meetings_company ON public.meetings USING btree (company_id)` |
| idx_meetings_contact_id_fk | btree | contact_id | não | sim |  | `CREATE INDEX idx_meetings_contact_id_fk ON public.meetings USING btree (contact_id)` |
| idx_meetings_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_meetings_deal_id ON public.meetings USING btree (deal_id)` |
| idx_meetings_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_meetings_user_id ON public.meetings USING btree (user_id)` |
| meetings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX meetings_pkey ON public.meetings USING btree (id)` |


## Policies (RLS)

### `meetings_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `meetings_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `meetings_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `meetings_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
