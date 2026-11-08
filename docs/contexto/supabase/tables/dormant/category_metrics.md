# _dormant.category_metrics

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
| 2 | `date` | `date` | não |  |  |  |
| 3 | `category` | `text` | não |  |  |  |
| 4 | `percentage` | `numeric(5,2)` | não | `0` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| category_metrics_date_category_key | UNIQUE | `UNIQUE (date, category)` |  |  | sim |
| category_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| category_metrics_date_category_key | btree | date, category | sim | sim |  | `CREATE UNIQUE INDEX category_metrics_date_category_key ON _dormant.category_metrics USING btree (date, category)` |
| category_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX category_metrics_pkey ON _dormant.category_metrics USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_category_metrics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
