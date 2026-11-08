# _dormant.lead_history

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
| 2 | `lead_id` | `uuid` | não |  |  |  |
| 3 | `campo` | `character varying(100)` | não |  |  |  |
| 4 | `valor_anterior` | `text` | sim |  |  |  |
| 5 | `valor_novo` | `text` | sim |  |  |  |
| 6 | `stage_anterior_id` | `uuid` | sim |  |  |  |
| 7 | `stage_novo_id` | `uuid` | sim |  |  |  |
| 8 | `changed_by` | `uuid` | sim |  |  |  |
| 9 | `changed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `observacao` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_history_lead_id_fkey | FOREIGN KEY | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lead_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_history_stage_anterior_id_fkey | FOREIGN KEY | `FOREIGN KEY (stage_anterior_id) REFERENCES pipeline_stages(id)` | NO ACTION | NO ACTION | sim |
| lead_history_stage_novo_id_fkey | FOREIGN KEY | `FOREIGN KEY (stage_novo_id) REFERENCES pipeline_stages(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lead_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_history_pkey ON _dormant.lead_history USING btree (id)` |


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
