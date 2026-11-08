# singu_migration._source_schema

> Cache do schema capturado do banco SINGU origem. Populado via chat Lovable + colagem manual.

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
| 1 | `table_name` | `text` | não |  |  |  |
| 2 | `columns_json` | `jsonb` | sim |  |  |  |
| 3 | `primary_keys` | `jsonb` | sim |  |  |  |
| 4 | `foreign_keys` | `jsonb` | sim |  |  |  |
| 5 | `row_count` | `integer` | sim |  |  |  |
| 6 | `captured_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| _source_schema_pkey | PRIMARY KEY | `PRIMARY KEY (table_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| _source_schema_pkey | btree | table_name | sim | sim |  | `CREATE UNIQUE INDEX _source_schema_pkey ON singu_migration._source_schema USING btree (table_name)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
