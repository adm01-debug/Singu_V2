# public.intent_signals

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
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `external_company_id` | `text` | sim |  |  |  |
| 6 | `signal_type` | `text` | não |  |  |  |
| 7 | `signal_source` | `text` | sim |  |  |  |
| 8 | `signal_value` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `weight` | `integer` | não | `1` |  |  |
| 10 | `occurred_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| intent_signals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| intent_signals_signal_type_check | CHECK | `CHECK (signal_type = ANY (ARRAY['page_view'::text, 'email_open'::text, 'email_click'::text, 'form_submit'::text, 'content_download'::text, 'pricing_view'::text, 'demo_request'::text, 'social_engagement'::text, 'search_query'::text, 'competitor_mention'::text]))` |  |  | sim |
| intent_signals_weight_check | CHECK | `CHECK (weight >= 1 AND weight <= 10)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| intent_signals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX intent_signals_pkey ON public.intent_signals USING btree (id)` |


## Policies (RLS)

### `Users delete own intent signals`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own intent signals`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own intent signals`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users view own intent signals`

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
| audit_intent_signals | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| tg_intent_signals_enqueue_score | AFTER | INSERT | ROW | enabled | public.trigger_lead_score_recompute |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
