# _dormant.activity_log

> Log de auditoria de todas as ações no sistema

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
| usada por views | public.vw_disc_compatibility |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `entity_type` | `character varying(50)` | não |  |  |  |
| 3 | `entity_id` | `uuid` | não |  |  |  |
| 4 | `action` | `character varying(50)` | não |  |  |  |
| 5 | `old_values` | `jsonb` | sim |  |  |  |
| 6 | `new_values` | `jsonb` | sim |  |  |  |
| 7 | `changes` | `jsonb` | sim |  |  |  |
| 8 | `user_id` | `uuid` | sim |  |  |  |
| 9 | `user_name` | `character varying(100)` | sim |  |  |  |
| 10 | `user_ip` | `character varying(45)` | sim |  |  |  |
| 11 | `user_agent` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| activity_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| activity_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX activity_log_pkey ON _dormant.activity_log USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
