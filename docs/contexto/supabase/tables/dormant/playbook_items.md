# _dormant.playbook_items

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
| 2 | `playbook_id` | `uuid` | não |  |  |  |
| 3 | `content` | `text` | não |  |  |  |
| 4 | `item_order` | `integer` | não | `0` |  |  |
| 5 | `is_required` | `boolean` | não | `false` |  |  |
| 6 | `item_type` | `text` | não | `'checklist'::text` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| playbook_items_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| playbook_items_playbook_id_fkey | FOREIGN KEY | `FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.playbook_progress | playbook_progress_playbook_item_id_fkey | playbook_item_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| playbook_items_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX playbook_items_pkey ON _dormant.playbook_items USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
