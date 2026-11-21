# public.social_life_events

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `platform` | `text` | não |  |  |  |
| 5 | `event_type` | `text` | não |  |  |  |
| 6 | `event_title` | `text` | não |  |  |  |
| 7 | `event_description` | `text` | sim |  |  |  |
| 8 | `event_date` | `timestamp with time zone` | sim |  |  |  |
| 9 | `previous_value` | `text` | sim |  |  |  |
| 10 | `new_value` | `text` | sim |  |  |  |
| 11 | `confidence` | `numeric` | sim | `0.8` |  |  |
| 12 | `metadata` | `jsonb` | sim |  |  |  |
| 13 | `notified` | `boolean` | sim | `false` |  |  |
| 14 | `dismissed` | `boolean` | sim | `false` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| social_life_events_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| social_life_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_social_life_events_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_social_life_events_contact ON public.social_life_events USING btree (contact_id)` |
| idx_social_life_events_date | btree | event_date | não | sim |  | `CREATE INDEX idx_social_life_events_date ON public.social_life_events USING btree (event_date)` |
| idx_social_life_events_type | btree | event_type | não | sim |  | `CREATE INDEX idx_social_life_events_type ON public.social_life_events USING btree (event_type)` |
| idx_social_life_events_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_social_life_events_user_id ON public.social_life_events USING btree (user_id)` |
| social_life_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX social_life_events_pkey ON public.social_life_events USING btree (id)` |


## Policies (RLS)

### `Users can delete their own social life events`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own social life events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own social life events`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own social life events`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `social_life_events_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `social_life_events_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `social_life_events_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `social_life_events_update`

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
