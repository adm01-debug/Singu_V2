# _dormant.tasks

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
| 2 | `titulo` | `character varying(255)` | não |  |  |  |
| 3 | `descricao` | `text` | sim |  |  |  |
| 4 | `lead_id` | `uuid` | sim |  |  |  |
| 5 | `deal_id` | `uuid` | sim |  |  |  |
| 6 | `company_id` | `uuid` | sim |  |  |  |
| 7 | `contact_id` | `uuid` | sim |  |  |  |
| 8 | `tipo` | `character varying(50)` | sim | `'tarefa'::character varying` |  |  |
| 9 | `prioridade` | `priority_level` | sim | `'media'::priority_level` |  |  |
| 10 | `owner_id` | `uuid` | não |  |  |  |
| 11 | `created_by_id` | `uuid` | sim |  |  |  |
| 12 | `data_vencimento` | `timestamp with time zone` | sim |  |  |  |
| 13 | `data_conclusao` | `timestamp with time zone` | sim |  |  |  |
| 14 | `status` | `character varying(20)` | sim | `'pendente'::character varying` |  |  |
| 15 | `resultado` | `text` | sim |  |  |  |
| 16 | `is_recorrente` | `boolean` | sim | `false` |  |  |
| 17 | `recorrencia_tipo` | `character varying(20)` | sim |  |  |  |
| 18 | `recorrencia_intervalo` | `integer` | sim |  |  |  |
| 19 | `lembrete_minutos` | `integer` | sim |  |  |  |
| 20 | `lembrete_enviado` | `boolean` | sim | `false` |  |  |
| 21 | `workflow_execution_id` | `uuid` | sim |  |  |  |
| 22 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 23 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 24 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tasks_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tasks_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tasks_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES _dormant.deals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tasks_lead_id_fkey | FOREIGN KEY | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tasks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| tasks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tasks_pkey ON _dormant.tasks USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
