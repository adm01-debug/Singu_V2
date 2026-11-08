# _dormant.lux_intelligence

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `entity_id` | `uuid` | não |  |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `request_type` | `text` | não | `'full_scan'::text` |  |  |
| 7 | `social_profiles` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `social_analysis` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `fiscal_data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `stakeholders` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 11 | `audience_analysis` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `personal_profile` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `ai_report` | `text` | sim |  |  |  |
| 14 | `ai_summary` | `text` | sim |  |  |  |
| 15 | `fields_updated` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 16 | `error_message` | `text` | sim |  |  |  |
| 17 | `n8n_execution_id` | `text` | sim |  |  |  |
| 18 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lux_intelligence_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['contact'::text, 'company'::text]))` |  |  | sim |
| lux_intelligence_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lux_intelligence_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'error'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lux_intelligence_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lux_intelligence_pkey ON _dormant.lux_intelligence USING btree (id)` |


## Policies (RLS)

### `Users can delete their own lux intelligence`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own lux intelligence`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own lux intelligence`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own lux intelligence`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_lux_intelligence | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
