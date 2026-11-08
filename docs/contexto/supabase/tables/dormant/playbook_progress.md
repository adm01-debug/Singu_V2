# _dormant.playbook_progress

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
| 2 | `playbook_item_id` | `uuid` | não |  |  |  |
| 3 | `sale_id` | `uuid` | não |  |  |  |
| 4 | `completed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `completed_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| playbook_progress_completed_by_fkey | FOREIGN KEY | `FOREIGN KEY (completed_by) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| playbook_progress_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| playbook_progress_playbook_item_id_fkey | FOREIGN KEY | `FOREIGN KEY (playbook_item_id) REFERENCES playbook_items(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| playbook_progress_playbook_item_id_sale_id_key | UNIQUE | `UNIQUE (playbook_item_id, sale_id)` |  |  | sim |
| playbook_progress_sale_id_fkey | FOREIGN KEY | `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| playbook_progress_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX playbook_progress_pkey ON _dormant.playbook_progress USING btree (id)` |
| playbook_progress_playbook_item_id_sale_id_key | btree | playbook_item_id, sale_id | sim | sim |  | `CREATE UNIQUE INDEX playbook_progress_playbook_item_id_sale_id_key ON _dormant.playbook_progress USING btree (playbook_item_id, sale_id)` |


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
