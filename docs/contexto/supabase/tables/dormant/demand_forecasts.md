# _dormant.demand_forecasts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `product_id` | `uuid` | sim |  |  |  |
| 3 | `forecast_date` | `date` | não |  |  |  |
| 4 | `predicted_quantity` | `integer` | não | `0` |  |  |
| 5 | `predicted_revenue` | `numeric(12,2)` | não | `0` |  |  |
| 6 | `confidence_score` | `numeric(5,2)` | sim | `0.80` |  |  |
| 7 | `factors` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `model_version` | `text` | sim | `'v1'::text` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| demand_forecasts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| demand_forecasts_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES _dormant.products(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| demand_forecasts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX demand_forecasts_pkey ON _dormant.demand_forecasts USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
