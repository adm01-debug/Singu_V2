# public.calendar_events

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `event_type` | `text` | sim | `'meeting'::text` |  |  |
| 5 | `start_time` | `timestamp with time zone` | não |  |  |  |
| 6 | `end_time` | `timestamp with time zone` | sim |  |  |  |
| 7 | `all_day` | `boolean` | sim | `false` |  |  |
| 8 | `company_id` | `uuid` | sim |  |  |  |
| 9 | `contact_id` | `uuid` | sim |  |  |  |
| 10 | `deal_id` | `uuid` | sim |  |  |  |
| 11 | `user_id` | `uuid` | sim |  |  |  |
| 12 | `location` | `text` | sim |  |  |  |
| 13 | `video_link` | `text` | sim |  |  |  |
| 14 | `status` | `text` | sim | `'scheduled'::text` |  |  |
| 15 | `reminder_minutes` | `integer` | sim | `30` |  |  |
| 16 | `external_id` | `text` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| calendar_events_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| calendar_events_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| calendar_events_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id)` | NO ACTION | NO ACTION | sim |
| calendar_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| chk_calendar_events_status | CHECK | `CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text, 'tentative'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| calendar_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX calendar_events_pkey ON public.calendar_events USING btree (id)` |
| idx_calendar_company | btree | company_id | não | sim |  | `CREATE INDEX idx_calendar_company ON public.calendar_events USING btree (company_id)` |
| idx_calendar_events_contact_id_fk | btree | contact_id | não | sim |  | `CREATE INDEX idx_calendar_events_contact_id_fk ON public.calendar_events USING btree (contact_id)` |
| idx_calendar_events_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_calendar_events_deal_id ON public.calendar_events USING btree (deal_id)` |
| idx_calendar_events_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_calendar_events_user_id ON public.calendar_events USING btree (user_id)` |


## Policies (RLS)

### `Users own data`

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
| trg_calendar_events_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
