# public.churn_risk_factors

> Configuração dos fatores que indicam risco de churn

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `factor_name` | `character varying(100)` | não |  |  |  |
| 3 | `factor_description` | `text` | sim |  |  |  |
| 4 | `factor_type` | `character varying(50)` | não |  |  |  |
| 5 | `weight` | `numeric(5,2)` | não | `1.0` |  |  |
| 6 | `threshold_low` | `numeric(10,2)` | sim |  |  |  |
| 7 | `threshold_medium` | `numeric(10,2)` | sim |  |  |  |
| 8 | `threshold_high` | `numeric(10,2)` | sim |  |  |  |
| 9 | `calculation_query` | `text` | sim |  |  |  |
| 10 | `is_active` | `boolean` | sim | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| churn_risk_factors_factor_name_key | UNIQUE | `UNIQUE (factor_name)` |  |  | sim |
| churn_risk_factors_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| churn_risk_factors_factor_name_key | btree | factor_name | sim | sim |  | `CREATE UNIQUE INDEX churn_risk_factors_factor_name_key ON public.churn_risk_factors USING btree (factor_name)` |
| churn_risk_factors_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX churn_risk_factors_pkey ON public.churn_risk_factors USING btree (id)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| update_churn_risk_factors_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
