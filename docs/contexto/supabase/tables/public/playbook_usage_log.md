# public.playbook_usage_log

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `playbook_id` | `uuid` | sim |  |  |  |
| 4 | `battle_card_id` | `uuid` | sim |  |  |  |
| 5 | `contact_id` | `uuid` | sim |  |  |  |
| 6 | `deal_id` | `text` | sim |  |  |  |
| 7 | `action` | `text` | não |  |  |  |
| 8 | `context` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `opened_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| playbook_usage_log_action_check | CHECK | `CHECK (action = ANY (ARRAY['opened'::text, 'copied'::text, 'shared'::text, 'recommended'::text, 'used_in_deal'::text]))` |  |  | sim |
| playbook_usage_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_playbook_usage_battle_card | btree | battle_card_id, opened_at | não | sim |  | `CREATE INDEX idx_playbook_usage_battle_card ON public.playbook_usage_log USING btree (battle_card_id, opened_at DESC)` |
| idx_playbook_usage_playbook | btree | playbook_id, opened_at | não | sim |  | `CREATE INDEX idx_playbook_usage_playbook ON public.playbook_usage_log USING btree (playbook_id, opened_at DESC)` |
| idx_playbook_usage_user | btree | user_id, opened_at | não | sim |  | `CREATE INDEX idx_playbook_usage_user ON public.playbook_usage_log USING btree (user_id, opened_at DESC)` |
| playbook_usage_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX playbook_usage_log_pkey ON public.playbook_usage_log USING btree (id)` |


## Policies (RLS)

### `playbook_usage_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `playbook_usage_select_own`

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
| tg_playbook_usage_increment | AFTER | INSERT | ROW | enabled | public.increment_playbook_usage |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
