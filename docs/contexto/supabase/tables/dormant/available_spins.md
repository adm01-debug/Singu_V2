# _dormant.available_spins

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
| 2 | `salesperson_id` | `uuid` | não |  |  |  |
| 3 | `spins_available` | `integer` | não | `0` |  |  |
| 4 | `last_earned_at` | `timestamp with time zone` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| available_spins_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| available_spins_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| available_spins_salesperson_id_key | UNIQUE | `UNIQUE (salesperson_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| available_spins_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX available_spins_pkey ON _dormant.available_spins USING btree (id)` |
| available_spins_salesperson_id_key | btree | salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX available_spins_salesperson_id_key ON _dormant.available_spins USING btree (salesperson_id)` |


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
