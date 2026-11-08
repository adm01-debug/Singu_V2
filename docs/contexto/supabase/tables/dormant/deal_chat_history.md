# _dormant.deal_chat_history

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `deal_id` | `uuid` | não |  |  |  |
| 3 | `salesperson_id` | `uuid` | sim |  |  |  |
| 4 | `question` | `text` | não |  |  |  |
| 5 | `response` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_chat_history_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES sales(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| deal_chat_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_chat_history_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_chat_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_chat_history_pkey ON _dormant.deal_chat_history USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_deal_chat_history`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
