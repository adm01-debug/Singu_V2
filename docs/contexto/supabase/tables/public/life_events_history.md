# public.life_events_history

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
| usada por views | public.v_life_events_audit |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `life_event_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `user_id` | `uuid` | sim |  |  |  |
| 5 | `event_type` | `text` | não |  |  |  |
| 6 | `title` | `text` | não |  |  |  |
| 7 | `event_date` | `timestamp with time zone` | não |  |  |  |
| 8 | `recurring` | `boolean` | sim |  |  |  |
| 9 | `reminder_days_before` | `integer` | sim |  |  |  |
| 10 | `change_type` | `text` | não |  |  |  |
| 11 | `reason` | `text` | sim |  |  |  |
| 12 | `changed_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| life_events_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| life_events_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX life_events_history_pkey ON public.life_events_history USING btree (id)` |


## Policies (RLS)

### `Users can view their own life events history`

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

_nenhum_
