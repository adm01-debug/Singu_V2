# public.contact_automation_settings

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `reminder_enabled` | `boolean` | sim | `true` |  |  |
| 5 | `escalation_enabled` | `boolean` | sim | `false` |  |  |
| 6 | `delay_hours` | `integer` | sim | `24` |  |  |
| 7 | `escalation_role` | `text` | sim | `'supervisor'::text` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `last_escalation_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `resolution_summary` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_automation_settings_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_automation_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_automation_settings_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_automation_settings_contact_id_key ON public.contact_automation_settings USING btree (contact_id)` |
| contact_automation_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_automation_settings_pkey ON public.contact_automation_settings USING btree (id)` |


## Policies (RLS)

### `Users can manage their own contact automation settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_contact_automation_settings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
