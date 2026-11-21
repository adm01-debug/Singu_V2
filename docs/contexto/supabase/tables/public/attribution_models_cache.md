# public.attribution_models_cache

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
| 3 | `deal_id` | `text` | não |  |  |  |
| 4 | `model` | `text` | não |  |  |  |
| 5 | `allocations` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 6 | `total_value` | `numeric` | não | `0` |  |  |
| 7 | `computed_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| attribution_models_cache_model_check | CHECK | `CHECK (model = ANY (ARRAY['first'::text, 'last'::text, 'linear'::text, 'u_shape'::text, 'w_shape'::text, 'time_decay'::text]))` |  |  | sim |
| attribution_models_cache_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| attribution_models_cache_user_id_deal_id_model_key | UNIQUE | `UNIQUE (user_id, deal_id, model)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| attribution_models_cache_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX attribution_models_cache_pkey ON public.attribution_models_cache USING btree (id)` |
| attribution_models_cache_user_id_deal_id_model_key | btree | user_id, deal_id, model | sim | sim |  | `CREATE UNIQUE INDEX attribution_models_cache_user_id_deal_id_model_key ON public.attribution_models_cache USING btree (user_id, deal_id, model)` |


## Policies (RLS)

### `amc_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
