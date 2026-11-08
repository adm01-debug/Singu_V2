# singu_migration._checklist

> Controle de progresso da migração SINGU. Cada linha = 1 tabela ou 1 operação estrutural.

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
| 1 | `id` | `integer` | não | `nextval('singu_migration._checklist_id_seq'::regclass)` |  |  |
| 2 | `step_number` | `integer` | não |  |  |  |
| 3 | `step_name` | `text` | não |  |  |  |
| 4 | `status` | `text` | sim | `'pending'::text` |  |  |
| 5 | `source_rows` | `integer` | sim |  |  |  |
| 6 | `target_rows` | `integer` | sim |  |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| _checklist_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| _checklist_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'done'::text, 'skipped'::text, 'error'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| _checklist_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX _checklist_pkey ON singu_migration._checklist USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
