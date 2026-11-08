# _dormant.salesperson_preferences

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
| 3 | `sound_enabled` | `boolean` | não | `true` |  |  |
| 4 | `sound_volume` | `numeric(3,2)` | não | `0.7` |  |  |
| 5 | `celebration_sound` | `text` | sim | `'default'::text` |  |  |
| 6 | `notification_sound` | `text` | sim | `'default'::text` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| salesperson_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| salesperson_preferences_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| salesperson_preferences_salesperson_id_key | UNIQUE | `UNIQUE (salesperson_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| salesperson_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX salesperson_preferences_pkey ON _dormant.salesperson_preferences USING btree (id)` |
| salesperson_preferences_salesperson_id_key | btree | salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX salesperson_preferences_salesperson_id_key ON _dormant.salesperson_preferences USING btree (salesperson_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
