# _dormant.contact_tags

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
| 1 | `contact_id` | `uuid` | não |  |  |  |
| 2 | `tag_id` | `uuid` | não |  |  |  |
| 3 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_tags_pkey | PRIMARY KEY | `PRIMARY KEY (contact_id, tag_id)` |  |  | sim |
| contact_tags_tag_id_fkey | FOREIGN KEY | `FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_tags_pkey | btree | contact_id, tag_id | sim | sim |  | `CREATE UNIQUE INDEX contact_tags_pkey ON _dormant.contact_tags USING btree (contact_id, tag_id)` |


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
