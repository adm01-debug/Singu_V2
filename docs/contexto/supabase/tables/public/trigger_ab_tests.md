# public.trigger_ab_tests

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `trigger_type_id` | `uuid` | sim |  |  |  |
| 4 | `test_name` | `text` | não |  |  |  |
| 5 | `variant_a_config` | `jsonb` | não |  |  |  |
| 6 | `variant_b_config` | `jsonb` | não |  |  |  |
| 7 | `metric_to_optimize` | `text` | não |  |  |  |
| 8 | `status` | `text` | sim | `'draft'::text` |  |  |
| 9 | `start_date` | `timestamp with time zone` | sim |  |  |  |
| 10 | `end_date` | `timestamp with time zone` | sim |  |  |  |
| 11 | `variant_a_impressions` | `integer` | sim | `0` |  |  |
| 12 | `variant_b_impressions` | `integer` | sim | `0` |  |  |
| 13 | `variant_a_conversions` | `integer` | sim | `0` |  |  |
| 14 | `variant_b_conversions` | `integer` | sim | `0` |  |  |
| 15 | `winner` | `text` | sim |  |  |  |
| 16 | `statistical_significance` | `numeric` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `contact_id` | `uuid` | sim |  |  |  |
| 20 | `name` | `text` | sim |  |  |  |
| 21 | `disc_profile` | `text` | sim |  |  |  |
| 22 | `variant_a_trigger` | `text` | sim |  |  |  |
| 23 | `variant_a_template` | `text` | sim |  |  |  |
| 24 | `variant_a_uses` | `integer` | sim | `0` |  |  |
| 25 | `variant_a_avg_rating` | `numeric(3,2)` | sim | `0` |  |  |
| 26 | `variant_b_trigger` | `text` | sim |  |  |  |
| 27 | `variant_b_template` | `text` | sim |  |  |  |
| 28 | `variant_b_uses` | `integer` | sim | `0` |  |  |
| 29 | `variant_b_avg_rating` | `numeric(3,2)` | sim | `0` |  |  |
| 30 | `confidence` | `numeric(5,2)` | sim | `0` |  |  |
| 31 | `is_active` | `boolean` | sim | `true` |  |  |
| 32 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 33 | `completed_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_ab_tests_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trigger_ab_tests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trigger_ab_tests_active | btree | is_active | não | sim | `(is_active = true)` | `CREATE INDEX idx_trigger_ab_tests_active ON public.trigger_ab_tests USING btree (is_active) WHERE (is_active = true)` |
| idx_trigger_ab_tests_disc | btree | disc_profile | não | sim |  | `CREATE INDEX idx_trigger_ab_tests_disc ON public.trigger_ab_tests USING btree (disc_profile)` |
| idx_trigger_ab_tests_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_trigger_ab_tests_user_contact ON public.trigger_ab_tests USING btree (user_id, contact_id)` |
| idx_trigger_ab_tests_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_trigger_ab_tests_user_id ON public.trigger_ab_tests USING btree (user_id)` |
| trigger_ab_tests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_ab_tests_pkey ON public.trigger_ab_tests USING btree (id)` |


## Policies (RLS)

### `Users can create their own AB tests`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete their own AB tests`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can update their own AB tests`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own AB tests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `trigger_ab_tests_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `trigger_ab_tests_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `trigger_ab_tests_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `trigger_ab_tests_update`

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
| set_updated_at_trigger_ab_tests | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
