# _dormant.collectible_badges

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `icon` | `text` | não | `'trophy'::text` |  |  |
| 5 | `category` | `text` | não | `'achievement'::text` |  |  |
| 6 | `rarity` | `text` | não | `'common'::text` |  |  |
| 7 | `requirement_type` | `text` | não |  |  |  |
| 8 | `requirement_value` | `integer` | não | `1` |  |  |
| 9 | `xp_reward` | `integer` | não | `50` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| collectible_badges_name_key | UNIQUE | `UNIQUE (name)` |  |  | sim |
| collectible_badges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| collectible_badges_rarity_check | CHECK | `CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.salesperson_badges | salesperson_badges_badge_id_fkey | badge_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| collectible_badges_name_key | btree | name | sim | sim |  | `CREATE UNIQUE INDEX collectible_badges_name_key ON _dormant.collectible_badges USING btree (name)` |
| collectible_badges_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX collectible_badges_pkey ON _dormant.collectible_badges USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_collectible_badges`

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
