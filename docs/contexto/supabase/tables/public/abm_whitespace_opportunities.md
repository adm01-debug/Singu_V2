# public.abm_whitespace_opportunities

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
| 2 | `account_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `opportunity_type` | `text` | não |  |  |  |
| 5 | `product_category` | `text` | não |  |  |  |
| 6 | `estimated_value` | `numeric` | sim |  |  |  |
| 7 | `confidence` | `integer` | não | `50` |  |  |
| 8 | `rationale` | `text` | sim |  |  |  |
| 9 | `status` | `text` | não | `'identified'::text` |  |  |
| 10 | `identified_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| abm_whitespace_opportunities_confidence_check | CHECK | `CHECK (confidence >= 0 AND confidence <= 100)` |  |  | sim |
| abm_whitespace_opportunities_opportunity_type_check | CHECK | `CHECK (opportunity_type = ANY (ARRAY['cross_sell'::text, 'up_sell'::text, 'expansion'::text, 'renewal'::text]))` |  |  | sim |
| abm_whitespace_opportunities_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| abm_whitespace_opportunities_status_check | CHECK | `CHECK (status = ANY (ARRAY['identified'::text, 'pursuing'::text, 'won'::text, 'lost'::text, 'dismissed'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| abm_whitespace_opportunities_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX abm_whitespace_opportunities_pkey ON public.abm_whitespace_opportunities USING btree (id)` |


## Policies (RLS)

### `abm_whitespace_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_whitespace_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `abm_whitespace_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_whitespace_update`

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
| abm_whitespace_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
