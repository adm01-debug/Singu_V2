# public.conversation_analyses

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
| 3 | `interaction_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `deal_id` | `uuid` | sim |  |  |  |
| 6 | `duration_seconds` | `integer` | sim |  |  |  |
| 7 | `talk_ratio_rep` | `numeric(5,2)` | sim |  |  |  |
| 8 | `talk_ratio_customer` | `numeric(5,2)` | sim |  |  |  |
| 9 | `longest_monologue_seconds` | `integer` | sim |  |  |  |
| 10 | `questions_asked` | `integer` | sim | `0` |  |  |
| 11 | `sentiment_overall` | `text` | sim |  |  |  |
| 12 | `sentiment_timeline` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 13 | `topics` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 14 | `objections` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 15 | `action_items` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 16 | `key_moments` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 17 | `coaching_score` | `integer` | sim |  |  |  |
| 18 | `coaching_tips` | `text[]` | não | `'{}'::text[]` |  |  |
| 19 | `next_best_action` | `text` | sim |  |  |  |
| 20 | `model_used` | `text` | sim |  |  |  |
| 21 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conversation_analyses_coaching_score_check | CHECK | `CHECK (coaching_score >= 0 AND coaching_score <= 100)` |  |  | sim |
| conversation_analyses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conversation_analyses_sentiment_overall_check | CHECK | `CHECK (sentiment_overall = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text, 'mixed'::text]))` |  |  | sim |
| conversation_analyses_user_id_interaction_id_key | UNIQUE | `UNIQUE (user_id, interaction_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conversation_analyses_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conversation_analyses_pkey ON public.conversation_analyses USING btree (id)` |
| conversation_analyses_user_id_interaction_id_key | btree | user_id, interaction_id | sim | sim |  | `CREATE UNIQUE INDEX conversation_analyses_user_id_interaction_id_key ON public.conversation_analyses USING btree (user_id, interaction_id)` |
| idx_conv_analyses_user | btree | user_id, analyzed_at | não | sim |  | `CREATE INDEX idx_conv_analyses_user ON public.conversation_analyses USING btree (user_id, analyzed_at DESC)` |


## Policies (RLS)

### `conv_analyses_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `conv_analyses_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `conv_analyses_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `conv_analyses_update_own`

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
| trg_conv_analyses_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| trg_conv_analyses_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
