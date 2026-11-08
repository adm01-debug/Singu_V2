# _dormant.disc_compatibility

> SINGU: Matriz de compatibilidade entre perfis DISC

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
| 2 | `profile_a` | `text` | não |  |  |  |
| 3 | `profile_b` | `text` | não |  |  |  |
| 4 | `compatibility_score` | `integer` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `description_pt` | `text` | sim |  |  |  |
| 7 | `relationship_tips` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `relationship_tips_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 9 | `friction_points` | `text[]` | sim | `'{}'::text[]` |  |  |
| 10 | `friction_points_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 11 | `communication_strategies` | `text[]` | sim | `'{}'::text[]` |  |  |
| 12 | `communication_strategies_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_compatibility_compatibility_score_check | CHECK | `CHECK (compatibility_score >= 0 AND compatibility_score <= 100)` |  |  | sim |
| disc_compatibility_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| disc_compatibility_profile_a_check | CHECK | `CHECK (profile_a = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_compatibility_profile_a_profile_b_key | UNIQUE | `UNIQUE (profile_a, profile_b)` |  |  | sim |
| disc_compatibility_profile_b_check | CHECK | `CHECK (profile_b = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_compatibility_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_compatibility_pkey ON _dormant.disc_compatibility USING btree (id)` |
| disc_compatibility_profile_a_profile_b_key | btree | profile_a, profile_b | sim | sim |  | `CREATE UNIQUE INDEX disc_compatibility_profile_a_profile_b_key ON _dormant.disc_compatibility USING btree (profile_a, profile_b)` |


## Policies (RLS)

### `dormant_deny_all_disc_compatibility`

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
