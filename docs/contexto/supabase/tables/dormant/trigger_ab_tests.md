# _dormant.trigger_ab_tests

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
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `name` | `text` | não |  |  |  |
| 5 | `disc_profile` | `text` | sim |  |  |  |
| 6 | `variant_a_trigger` | `text` | não |  |  |  |
| 7 | `variant_a_template` | `text` | sim |  |  |  |
| 8 | `variant_a_uses` | `integer` | sim | `0` |  |  |
| 9 | `variant_a_conversions` | `integer` | sim | `0` |  |  |
| 10 | `variant_a_avg_rating` | `numeric(3,2)` | sim | `0` |  |  |
| 11 | `variant_b_trigger` | `text` | não |  |  |  |
| 12 | `variant_b_template` | `text` | sim |  |  |  |
| 13 | `variant_b_uses` | `integer` | sim | `0` |  |  |
| 14 | `variant_b_conversions` | `integer` | sim | `0` |  |  |
| 15 | `variant_b_avg_rating` | `numeric(3,2)` | sim | `0` |  |  |
| 16 | `winner` | `text` | sim |  |  |  |
| 17 | `confidence` | `numeric(5,2)` | sim | `0` |  |  |
| 18 | `is_active` | `boolean` | sim | `true` |  |  |
| 19 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_ab_tests_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trigger_ab_tests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_ab_tests_winner_check | CHECK | `CHECK (winner = ANY (ARRAY['A'::text, 'B'::text, 'tie'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trigger_ab_tests_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_trigger_ab_tests_user_contact ON _dormant.trigger_ab_tests USING btree (user_id, contact_id)` |
| trigger_ab_tests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_ab_tests_pkey ON _dormant.trigger_ab_tests USING btree (id)` |


## Policies (RLS)

### `Users can create their own AB tests`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own AB tests`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own AB tests`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own AB tests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_trigger_ab_tests | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
