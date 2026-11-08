# zapp_history.edge_function_templates

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
| 1 | `slug` | `text` | não |  |  |  |
| 2 | `version` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `code` | `text` | não |  |  |  |
| 5 | `deploy_instructions` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| edge_function_templates_pkey | PRIMARY KEY | `PRIMARY KEY (slug)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| edge_function_templates_pkey | btree | slug | sim | sim |  | `CREATE UNIQUE INDEX edge_function_templates_pkey ON zapp_history.edge_function_templates USING btree (slug)` |


## Policies (RLS)

### `eft_authenticated_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
