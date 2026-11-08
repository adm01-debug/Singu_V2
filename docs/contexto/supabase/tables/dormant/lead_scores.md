# _dormant.lead_scores

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
| 2 | `sale_id` | `uuid` | não |  |  |  |
| 3 | `score` | `integer` | não | `0` |  |  |
| 4 | `factors` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 5 | `calculated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_scores_sale_id_fkey | FOREIGN KEY | `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lead_scores_sale_id_key | UNIQUE | `UNIQUE (sale_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lead_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_scores_pkey ON _dormant.lead_scores USING btree (id)` |
| lead_scores_sale_id_key | btree | sale_id | sim | sim |  | `CREATE UNIQUE INDEX lead_scores_sale_id_key ON _dormant.lead_scores USING btree (sale_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
