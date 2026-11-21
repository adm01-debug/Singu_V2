# public.deal_rooms

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `deal_id` | `text` | sim |  |  |  |
| 4 | `deal_name` | `text` | sim |  |  |  |
| 5 | `company_id` | `uuid` | sim |  |  |  |
| 6 | `title` | `text` | não |  |  |  |
| 7 | `description` | `text` | sim |  |  |  |
| 8 | `status` | `text` | não | `'active'::text` |  |  |
| 9 | `deal_value` | `numeric` | sim |  |  |  |
| 10 | `target_close_date` | `date` | sim |  |  |  |
| 11 | `share_token` | `text` | não | `replace((gen_random_uuid())::text, '-'::text, ''::text)` |  |  |
| 12 | `share_enabled` | `boolean` | não | `false` |  |  |
| 13 | `last_buyer_view_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `buyer_view_count` | `integer` | não | `0` |  |  |
| 15 | `health_score` | `integer` | sim |  |  |  |
| 16 | `health_recommendations` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 17 | `health_analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_rooms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_rooms_share_token_key | UNIQUE | `UNIQUE (share_token)` |  |  | sim |
| deal_rooms_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'won'::text, 'lost'::text, 'paused'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_rooms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_rooms_pkey ON public.deal_rooms USING btree (id)` |
| deal_rooms_share_token_key | btree | share_token | sim | sim |  | `CREATE UNIQUE INDEX deal_rooms_share_token_key ON public.deal_rooms USING btree (share_token)` |
| idx_deal_rooms_company | btree | company_id | não | sim |  | `CREATE INDEX idx_deal_rooms_company ON public.deal_rooms USING btree (company_id)` |
| idx_deal_rooms_status | btree | user_id, status | não | sim |  | `CREATE INDEX idx_deal_rooms_status ON public.deal_rooms USING btree (user_id, status)` |
| idx_deal_rooms_token | btree | share_token | não | sim |  | `CREATE INDEX idx_deal_rooms_token ON public.deal_rooms USING btree (share_token)` |
| idx_deal_rooms_user | btree | user_id | não | sim |  | `CREATE INDEX idx_deal_rooms_user ON public.deal_rooms USING btree (user_id)` |


## Policies (RLS)

### `owner_all_rooms`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tr_dr_rooms_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| tr_dr_rooms_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
