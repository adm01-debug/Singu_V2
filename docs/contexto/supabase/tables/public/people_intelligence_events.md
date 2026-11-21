# public.people_intelligence_events

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
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
| 5 | `old_value` | `text` | sim |  |  |  |
| 6 | `new_value` | `text` | sim |  |  |  |
| 7 | `field_name` | `text` | sim |  |  |  |
| 8 | `source` | `text` | não | `'system_trigger'::text` |  |  |
| 9 | `confidence` | `integer` | não | `100` |  |  |
| 10 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 11 | `detected_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| people_intelligence_events_confidence_check | CHECK | `CHECK (confidence >= 0 AND confidence <= 100)` |  |  | sim |
| people_intelligence_events_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['job_change'::text, 'promotion'::text, 'company_change'::text, 'title_change'::text, 'linkedin_update'::text, 'social_event'::text, 'other'::text]))` |  |  | sim |
| people_intelligence_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pie_contact | btree | contact_id, detected_at | não | sim |  | `CREATE INDEX idx_pie_contact ON public.people_intelligence_events USING btree (contact_id, detected_at DESC)` |
| idx_pie_type | btree | event_type | não | sim |  | `CREATE INDEX idx_pie_type ON public.people_intelligence_events USING btree (event_type)` |
| idx_pie_user | btree | user_id | não | sim |  | `CREATE INDEX idx_pie_user ON public.people_intelligence_events USING btree (user_id)` |
| people_intelligence_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX people_intelligence_events_pkey ON public.people_intelligence_events USING btree (id)` |


## Policies (RLS)

### `pie_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `pie_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `pie_select_own`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
