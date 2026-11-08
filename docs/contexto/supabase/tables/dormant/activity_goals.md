# _dormant.activity_goals

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
| 2 | `salesperson_id` | `uuid` | não |  |  |  |
| 3 | `calls_goal` | `integer` | não | `30` |  |  |
| 4 | `emails_goal` | `integer` | não | `20` |  |  |
| 5 | `meetings_goal` | `integer` | não | `3` |  |  |
| 6 | `linkedin_goal` | `integer` | não | `10` |  |  |
| 7 | `whatsapp_goal` | `integer` | não | `15` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| activity_goals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| activity_goals_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| activity_goals_salesperson_id_key | UNIQUE | `UNIQUE (salesperson_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| activity_goals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX activity_goals_pkey ON _dormant.activity_goals USING btree (id)` |
| activity_goals_salesperson_id_key | btree | salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX activity_goals_salesperson_id_key ON _dormant.activity_goals USING btree (salesperson_id)` |


## Policies (RLS)

### `dormant_deny_all_activity_goals`

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
