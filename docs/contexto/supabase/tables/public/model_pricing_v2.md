# public.model_pricing_v2

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
| usada por views | public.v_model_catalog |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `model` | `text` | não |  |  |  |
| 3 | `provider` | `text` | não |  |  |  |
| 4 | `input_cost_per_1m` | `double precision` | não | `0` |  |  |
| 5 | `output_cost_per_1m` | `double precision` | não | `0` |  |  |
| 6 | `tier` | `text` | sim | `'standard'::text` |  |  |
| 7 | `capabilities` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `context_window` | `integer` | sim | `0` |  |  |
| 9 | `active_params` | `text` | sim |  |  |  |
| 10 | `total_params` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| model_pricing_v2_model_provider_key | UNIQUE | `UNIQUE (model, provider)` |  |  | sim |
| model_pricing_v2_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| model_pricing_v2_model_provider_key | btree | model, provider | sim | sim |  | `CREATE UNIQUE INDEX model_pricing_v2_model_provider_key ON public.model_pricing_v2 USING btree (model, provider)` |
| model_pricing_v2_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX model_pricing_v2_pkey ON public.model_pricing_v2 USING btree (id)` |


## Policies (RLS)

### `model_pricing_v2_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
