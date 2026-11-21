# public.intent_scores

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
| 3 | `scope` | `text` | não |  |  |  |
| 4 | `scope_id` | `text` | não |  |  |  |
| 5 | `intent_score` | `integer` | não | `0` |  |  |
| 6 | `score_trend` | `text` | não | `'stable'::text` |  |  |
| 7 | `signal_count_30d` | `integer` | não | `0` |  |  |
| 8 | `top_signals` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `computed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| intent_scores_intent_score_check | CHECK | `CHECK (intent_score >= 0 AND intent_score <= 100)` |  |  | sim |
| intent_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| intent_scores_scope_check | CHECK | `CHECK (scope = ANY (ARRAY['contact'::text, 'account'::text]))` |  |  | sim |
| intent_scores_score_trend_check | CHECK | `CHECK (score_trend = ANY (ARRAY['rising'::text, 'stable'::text, 'falling'::text]))` |  |  | sim |
| intent_scores_user_id_scope_scope_id_key | UNIQUE | `UNIQUE (user_id, scope, scope_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| intent_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX intent_scores_pkey ON public.intent_scores USING btree (id)` |
| intent_scores_user_id_scope_scope_id_key | btree | user_id, scope, scope_id | sim | sim |  | `CREATE UNIQUE INDEX intent_scores_user_id_scope_scope_id_key ON public.intent_scores USING btree (user_id, scope, scope_id)` |


## Policies (RLS)

### `Users delete own intent scores`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own intent scores`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own intent scores`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users view own intent scores`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_intent_scores_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
