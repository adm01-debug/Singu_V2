# public.trigger_bundles

> SINGU: Combinações pré-configuradas de gatilhos mentais

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
| 2 | `code` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `name_pt` | `text` | sim |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `description_pt` | `text` | sim |  |  |  |
| 7 | `trigger_codes` | `text[]` | não |  |  |  |
| 8 | `context` | `text` | sim |  |  |  |
| 9 | `ideal_disc` | `text[]` | sim | `'{}'::text[]` |  |  |
| 10 | `script_template` | `text` | sim |  |  |  |
| 11 | `script_template_pt` | `text` | sim |  |  |  |
| 12 | `usage_count` | `integer` | sim | `0` |  |  |
| 13 | `success_count` | `integer` | sim | `0` |  |  |
| 14 | `success_rate` | `numeric(5,2)` | sim |  |  |  |
| 15 | `is_active` | `boolean` | sim | `true` |  |  |
| 16 | `is_featured` | `boolean` | sim | `false` |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 19 | `user_id` | `uuid` | sim |  |  |  |
| 20 | `scenario` | `text` | sim |  |  |  |
| 21 | `disc_profiles` | `text[]` | sim | `'{}'::text[]` |  |  |
| 22 | `vak_profiles` | `text[]` | sim | `'{}'::text[]` |  |  |
| 23 | `metaprograms` | `text[]` | sim | `'{}'::text[]` |  |  |
| 24 | `triggers` | `text[]` | sim |  |  |  |
| 25 | `sequence_timing` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 26 | `neural_path` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 27 | `total_uses` | `integer` | sim | `0` |  |  |
| 28 | `is_system_bundle` | `boolean` | sim | `false` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_bundles_code_key | UNIQUE | `UNIQUE (code)` |  |  | sim |
| trigger_bundles_context_check | CHECK | `CHECK (context = ANY (ARRAY['cold_outreach'::text, 'follow_up'::text, 'negotiation'::text, 'closing'::text, 'objection_handling'::text, 'reactivation'::text, 'upsell'::text, 'retention'::text]))` |  |  | sim |
| trigger_bundles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trigger_bundles_scenario | btree | scenario | não | sim |  | `CREATE INDEX idx_trigger_bundles_scenario ON public.trigger_bundles USING btree (scenario)` |
| idx_trigger_bundles_system | btree | is_system_bundle | não | sim | `(is_system_bundle = true)` | `CREATE INDEX idx_trigger_bundles_system ON public.trigger_bundles USING btree (is_system_bundle) WHERE (is_system_bundle = true)` |
| idx_trigger_bundles_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_trigger_bundles_user_id ON public.trigger_bundles USING btree (user_id)` |
| trigger_bundles_code_key | btree | code | sim | sim |  | `CREATE UNIQUE INDEX trigger_bundles_code_key ON public.trigger_bundles USING btree (code)` |
| trigger_bundles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_bundles_pkey ON public.trigger_bundles USING btree (id)` |


## Policies (RLS)

### `Users can create their own bundles`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((auth.uid() = user_id) AND (COALESCE(is_system_bundle, false) = false))` |

### `Users can delete their own bundles`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((auth.uid() = user_id) AND (is_system_bundle = false))` |
| WITH CHECK |  |

### `Users can update their own bundles`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((auth.uid() = user_id) AND (is_system_bundle = false))` |
| WITH CHECK |  |

### `Users can view their own bundles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((auth.uid() = user_id) OR (is_system_bundle = true))` |
| WITH CHECK |  |

### `trigger_bundles_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `trigger_bundles_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `trigger_bundles_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `trigger_bundles_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_trigger_bundles | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
