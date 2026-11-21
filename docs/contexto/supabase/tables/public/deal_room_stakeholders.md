# public.deal_room_stakeholders

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
| 2 | `room_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `name` | `text` | não |  |  |  |
| 6 | `email` | `text` | sim |  |  |  |
| 7 | `role_title` | `text` | sim |  |  |  |
| 8 | `side` | `text` | não |  |  |  |
| 9 | `influence` | `text` | não | `'user'::text` |  |  |
| 10 | `engagement_score` | `integer` | não | `50` |  |  |
| 11 | `notes` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_room_stakeholders_engagement_score_check | CHECK | `CHECK (engagement_score >= 0 AND engagement_score <= 100)` |  |  | sim |
| deal_room_stakeholders_influence_check | CHECK | `CHECK (influence = ANY (ARRAY['champion'::text, 'decision_maker'::text, 'influencer'::text, 'blocker'::text, 'user'::text]))` |  |  | sim |
| deal_room_stakeholders_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_room_stakeholders_side_check | CHECK | `CHECK (side = ANY (ARRAY['seller'::text, 'buyer'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_room_stakeholders_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_room_stakeholders_pkey ON public.deal_room_stakeholders USING btree (id)` |
| idx_dr_stakeholders_room | btree | room_id | não | sim |  | `CREATE INDEX idx_dr_stakeholders_room ON public.deal_room_stakeholders USING btree (room_id)` |
| idx_dr_stakeholders_user | btree | user_id | não | sim |  | `CREATE INDEX idx_dr_stakeholders_user ON public.deal_room_stakeholders USING btree (user_id)` |


## Policies (RLS)

### `owner_all_sh`

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
| tr_dr_sh_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
