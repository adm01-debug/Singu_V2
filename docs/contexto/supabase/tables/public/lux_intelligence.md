# public.lux_intelligence

> Inteligência Lux (análise comportamental)

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
| usada por views | public.vw_singu_lux_status, public.vw_singu_readiness, public.vw_singu_usage_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `entity_id` | `uuid` | não |  |  |  |
| 4 | `entity_type` | `text` | não |  |  |  |
| 5 | `request_type` | `text` | não | `'full_scan'::text` |  |  |
| 6 | `status` | `text` | não | `'pending'::text` |  |  |
| 7 | `n8n_execution_id` | `text` | sim |  |  |  |
| 8 | `fiscal_data` | `jsonb` | sim |  |  |  |
| 9 | `social_profiles` | `jsonb` | sim |  |  |  |
| 10 | `social_analysis` | `jsonb` | sim |  |  |  |
| 11 | `audience_analysis` | `jsonb` | sim |  |  |  |
| 12 | `stakeholders` | `jsonb` | sim |  |  |  |
| 13 | `personal_profile` | `jsonb` | sim |  |  |  |
| 14 | `ai_summary` | `text` | sim |  |  |  |
| 15 | `ai_report` | `text` | sim |  |  |  |
| 16 | `fields_updated` | `jsonb` | sim |  |  |  |
| 17 | `error_message` | `text` | sim |  |  |  |
| 18 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_lux_entity_type | CHECK | `CHECK (entity_type = ANY (ARRAY['contact'::text, 'company'::text]))` |  |  | sim |
| chk_lux_status | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'error'::text]))` |  |  | sim |
| lux_intelligence_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lux_entity | btree | entity_id, entity_type | não | sim |  | `CREATE INDEX idx_lux_entity ON public.lux_intelligence USING btree (entity_id, entity_type)` |
| idx_lux_user | btree | user_id | não | sim |  | `CREATE INDEX idx_lux_user ON public.lux_intelligence USING btree (user_id)` |
| lux_intelligence_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lux_intelligence_pkey ON public.lux_intelligence USING btree (id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own lux intelligence`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can insert their own lux intelligence`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own lux intelligence`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own lux intelligence`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_lux_intelligence | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| update_lux_intelligence_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
