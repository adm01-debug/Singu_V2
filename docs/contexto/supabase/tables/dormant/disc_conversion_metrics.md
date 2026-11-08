# _dormant.disc_conversion_metrics

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
| 9 | `conversion_rate` | `numeric(5,2)` | sim |  |  |  |
| 10 | `average_deal_size` | `numeric` | sim |  |  |  |
| 11 | `average_sales_cycle_days` | `integer` | sim |  |  |  |
| 12 | `average_relationship_score` | `numeric(5,2)` | sim |  |  |  |
| 13 | `average_compatibility_score` | `numeric(5,2)` | sim |  |  |  |
| 14 | `period_start` | `date` | não |  |  |  |
| 15 | `period_end` | `date` | não |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_conversion_metrics_disc_profile_check | CHECK | `CHECK (disc_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_conversion_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| disc_conversion_metrics_user_id_disc_profile_period_start_p_key | UNIQUE | `UNIQUE (user_id, disc_profile, period_start, period_end)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_conversion_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_conversion_metrics_pkey ON _dormant.disc_conversion_metrics USING btree (id)` |
| disc_conversion_metrics_user_id_disc_profile_period_start_p_key | btree | user_id, disc_profile, period_start, period_end | sim | sim |  | `CREATE UNIQUE INDEX disc_conversion_metrics_user_id_disc_profile_period_start_p_key ON _dormant.disc_conversion_metrics USING btree (user_id, disc_profile, period_start, period_end)` |


## Policies (RLS)

### `Users can manage their own DISC conversion metrics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_disc_conversion_metrics | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
