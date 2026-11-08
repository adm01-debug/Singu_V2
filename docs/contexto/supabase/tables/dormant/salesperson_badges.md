# _dormant.salesperson_badges

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
| 3 | `badge_id` | `uuid` | não |  |  |  |
| 4 | `earned_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `is_displayed` | `boolean` | não | `true` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| salesperson_badges_badge_id_fkey | FOREIGN KEY | `FOREIGN KEY (badge_id) REFERENCES collectible_badges(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| salesperson_badges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| salesperson_badges_salesperson_id_badge_id_key | UNIQUE | `UNIQUE (salesperson_id, badge_id)` |  |  | sim |
| salesperson_badges_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| salesperson_badges_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX salesperson_badges_pkey ON _dormant.salesperson_badges USING btree (id)` |
| salesperson_badges_salesperson_id_badge_id_key | btree | salesperson_id, badge_id | sim | sim |  | `CREATE UNIQUE INDEX salesperson_badges_salesperson_id_badge_id_key ON _dormant.salesperson_badges USING btree (salesperson_id, badge_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
