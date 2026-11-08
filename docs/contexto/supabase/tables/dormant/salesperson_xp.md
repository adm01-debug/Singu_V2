# _dormant.salesperson_xp

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
| 3 | `total_xp` | `integer` | não | `0` |  |  |
| 4 | `current_level` | `integer` | não | `1` |  |  |
| 5 | `xp_to_next_level` | `integer` | não | `100` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| salesperson_xp_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| salesperson_xp_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| salesperson_xp_salesperson_id_key | UNIQUE | `UNIQUE (salesperson_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| salesperson_xp_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX salesperson_xp_pkey ON _dormant.salesperson_xp USING btree (id)` |
| salesperson_xp_salesperson_id_key | btree | salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX salesperson_xp_salesperson_id_key ON _dormant.salesperson_xp USING btree (salesperson_id)` |


## Policies (RLS)

### `dormant_deny_all_salesperson_xp`

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
