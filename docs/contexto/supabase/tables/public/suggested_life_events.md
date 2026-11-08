# public.suggested_life_events

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `event_type` | `text` | não |  |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `description` | `text` | sim |  |  |  |
| 7 | `event_date` | `timestamp with time zone` | sim |  |  |  |
| 8 | `source_type` | `text` | não |  |  |  |
| 9 | `confidence` | `double precision` | sim | `0.0` |  |  |
| 10 | `status` | `text` | não | `'pending'::text` |  |  |
| 11 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| suggested_life_events_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| suggested_life_events_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'promotion'::text, 'travel'::text, 'family'::text, 'achievement'::text, 'other'::text]))` |  |  | sim |
| suggested_life_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| suggested_life_events_source_type_check | CHECK | `CHECK (source_type = ANY (ARRAY['social'::text, 'conversation'::text, 'email'::text, 'manual_suggestion'::text]))` |  |  | sim |
| suggested_life_events_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))` |  |  | sim |
| suggested_life_events_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_suggested_life_events_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_suggested_life_events_contact_id ON public.suggested_life_events USING btree (contact_id)` |
| idx_suggested_life_events_status | btree | status | não | sim |  | `CREATE INDEX idx_suggested_life_events_status ON public.suggested_life_events USING btree (status)` |
| suggested_life_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX suggested_life_events_pkey ON public.suggested_life_events USING btree (id)` |


## Policies (RLS)

### `Owner or admin can delete suggested life events`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can update suggested life events`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Owner or admin can view suggested life events`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Service role can manage suggested life events`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `Users can insert their own suggested life events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_suggested_life_events_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
