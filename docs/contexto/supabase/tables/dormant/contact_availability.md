# _dormant.contact_availability

> SINGU: Mapa de disponibilidade semanal do contato

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `day_of_week` | `integer` | não |  |  |  |
| 5 | `time_start` | `time without time zone` | não |  |  |  |
| 6 | `time_end` | `time without time zone` | não |  |  |  |
| 7 | `availability_type` | `text` | não |  |  |  |
| 8 | `notes` | `text` | sim |  |  |  |
| 9 | `is_recurring` | `boolean` | sim | `true` |  |  |
| 10 | `specific_date` | `date` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_availability_availability_type_check | CHECK | `CHECK (availability_type = ANY (ARRAY['available'::text, 'busy'::text, 'tentative'::text, 'preferred'::text, 'avoid'::text]))` |  |  | sim |
| contact_availability_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_availability_day_of_week_check | CHECK | `CHECK (day_of_week >= 0 AND day_of_week <= 6)` |  |  | sim |
| contact_availability_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_availability_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_availability_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_availability_pkey ON _dormant.contact_availability USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_contact_availability`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
