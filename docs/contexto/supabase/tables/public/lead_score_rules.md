# public.lead_score_rules

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
| 3 | `dimension` | `text` | não |  |  |  |
| 4 | `signal_key` | `text` | não |  |  |  |
| 5 | `weight` | `numeric(5,2)` | não | `1` |  |  |
| 6 | `decay_days` | `integer` | não | `30` |  |  |
| 7 | `active` | `boolean` | não | `true` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_score_rules_dimension_check | CHECK | `CHECK (dimension = ANY (ARRAY['fit'::text, 'engagement'::text, 'intent'::text, 'relationship'::text]))` |  |  | sim |
| lead_score_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_score_rules_user_id_dimension_signal_key_key | UNIQUE | `UNIQUE (user_id, dimension, signal_key)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lead_score_rules_user | btree | user_id, active | não | sim |  | `CREATE INDEX idx_lead_score_rules_user ON public.lead_score_rules USING btree (user_id, active)` |
| lead_score_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_score_rules_pkey ON public.lead_score_rules USING btree (id)` |
| lead_score_rules_user_id_dimension_signal_key_key | btree | user_id, dimension, signal_key | sim | sim |  | `CREATE UNIQUE INDEX lead_score_rules_user_id_dimension_signal_key_key ON public.lead_score_rules USING btree (user_id, dimension, signal_key)` |


## Policies (RLS)

### `lead_score_rules_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `lead_score_rules_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `lead_score_rules_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `lead_score_rules_update_own`

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
| tg_lead_score_rules_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
