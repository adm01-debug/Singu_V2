# public.battle_cards

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `competitor_name` | `text` | não |  |  |  |
| 4 | `competitor_logo_url` | `text` | sim |  |  |  |
| 5 | `summary` | `text` | sim |  |  |  |
| 6 | `our_strengths` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 7 | `their_strengths` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 8 | `weaknesses` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `pricing_comparison` | `text` | sim |  |  |  |
| 10 | `win_themes` | `text[]` | não | `ARRAY[]::text[]` |  |  |
| 11 | `landmines` | `text[]` | não | `ARRAY[]::text[]` |  |  |
| 12 | `proof_points` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 13 | `last_updated_by` | `uuid` | sim |  |  |  |
| 14 | `version` | `integer` | não | `1` |  |  |
| 15 | `active` | `boolean` | não | `true` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| battle_cards_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| battle_cards_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX battle_cards_pkey ON public.battle_cards USING btree (id)` |


## Policies (RLS)

### `battle_cards_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `battle_cards_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `battle_cards_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `battle_cards_update_own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_battle_cards | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| update_battle_cards_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
