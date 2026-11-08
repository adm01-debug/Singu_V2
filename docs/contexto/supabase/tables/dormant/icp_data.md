# _dormant.icp_data

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
| 2 | `client_id` | `uuid` | não |  |  |  |
| 3 | `ramo_atividade` | `text` | sim |  |  |  |
| 4 | `grupo_nicho` | `text` | sim |  |  |  |
| 5 | `capital_social` | `numeric(15,2)` | sim |  |  |  |
| 6 | `num_colaboradores` | `integer` | sim |  |  |  |
| 7 | `is_icp_match` | `boolean` | sim | `false` |  |  |
| 8 | `bitrix_id` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| icp_data_client_id_fkey | FOREIGN KEY | `FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| icp_data_client_id_key | UNIQUE | `UNIQUE (client_id)` |  |  | sim |
| icp_data_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| icp_data_client_id_key | btree | client_id | sim | sim |  | `CREATE UNIQUE INDEX icp_data_client_id_key ON _dormant.icp_data USING btree (client_id)` |
| icp_data_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX icp_data_pkey ON _dormant.icp_data USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
