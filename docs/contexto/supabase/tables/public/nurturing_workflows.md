# public.nurturing_workflows

> SINGU: Fluxos de nutrição long-term (mais complexos que sequences). Trigger-based (score/segment/inactivity/event).

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
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `trigger_type` | `text` | não |  |  |  |
| 6 | `trigger_conditions` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `workflow_steps` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `total_enrolled` | `integer` | sim | `0` |  |  |
| 10 | `success_count` | `integer` | sim | `0` |  |  |
| 11 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `trigger_config` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 15 | `steps` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 16 | `enrolled_count` | `integer` | sim | `0` |  |  |
| 17 | `completed_count` | `integer` | sim | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nurturing_workflows_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| nurturing_workflows_trigger_type_check | CHECK | `CHECK (trigger_type = ANY (ARRAY['score_change'::text, 'segment_change'::text, 'inactivity'::text, 'event'::text, 'manual'::text, 'custom'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nurturing_workflows_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_nurturing_workflows_user_id ON public.nurturing_workflows USING btree (user_id)` |
| nurturing_workflows_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nurturing_workflows_pkey ON public.nurturing_workflows USING btree (id)` |


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

### `Users manage own nurturing workflows`

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
| update_nurturing_workflows_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
