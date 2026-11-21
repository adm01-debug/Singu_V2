# public.disc_conversion_metrics

> SINGU: Métricas agregadas de conversão por perfil DISC. Dados periódicos.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 9 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_singu_disc_dashboard, public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `disc_profile` | `text` | não |  |  |  |
| 4 | `blend_profile` | `text` | sim |  |  |  |
| 5 | `total_contacts` | `integer` | não | `0` |  |  |
| 6 | `total_opportunities` | `integer` | não | `0` |  |  |
| 7 | `converted_count` | `integer` | não | `0` |  |  |
| 8 | `lost_count` | `integer` | não | `0` |  |  |
| 9 | `conversion_rate` | `numeric` | sim |  |  |  |
| 10 | `average_deal_size` | `numeric` | sim |  |  |  |
| 11 | `average_sales_cycle_days` | `integer` | sim |  |  |  |
| 12 | `average_relationship_score` | `numeric` | sim |  |  |  |
| 13 | `average_compatibility_score` | `numeric` | sim |  |  |  |
| 14 | `period_start` | `date` | não |  |  |  |
| 15 | `period_end` | `date` | não |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_conversion_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_conversion_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_conversion_metrics_pkey ON public.disc_conversion_metrics USING btree (id)` |
| disc_conversion_metrics_user_id_disc_profile_period_start_p_key | btree | user_id, disc_profile, period_start, period_end | sim | sim |  | `CREATE UNIQUE INDEX disc_conversion_metrics_user_id_disc_profile_period_start_p_key ON public.disc_conversion_metrics USING btree (user_id, disc_profile, period_start, period_end)` |
| idx_disc_conversion_metrics_user | btree | user_id | não | sim |  | `CREATE INDEX idx_disc_conversion_metrics_user ON public.disc_conversion_metrics USING btree (user_id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own DISC conversion metrics`

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

### `Users can insert their own DISC conversion metrics`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can manage their own DISC conversion metrics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own DISC conversion metrics`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own DISC conversion metrics`

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
| set_updated_at_disc_conversion_metrics | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| update_disc_conversion_metrics_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
