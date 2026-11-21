# public.abm_campaigns

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
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `campaign_type` | `text` | não |  |  |  |
| 6 | `target_account_ids` | `uuid[]` | não | `ARRAY[]::uuid[]` |  |  |
| 7 | `channels` | `text[]` | não | `ARRAY[]::text[]` |  |  |
| 8 | `status` | `text` | não | `'draft'::text` |  |  |
| 9 | `start_date` | `date` | sim |  |  |  |
| 10 | `end_date` | `date` | sim |  |  |  |
| 11 | `budget` | `numeric` | sim |  |  |  |
| 12 | `metrics` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| abm_campaigns_campaign_type_check | CHECK | `CHECK (campaign_type = ANY (ARRAY['one_to_one'::text, 'one_to_few'::text, 'one_to_many'::text]))` |  |  | sim |
| abm_campaigns_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| abm_campaigns_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'archived'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| abm_campaigns_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX abm_campaigns_pkey ON public.abm_campaigns USING btree (id)` |
| idx_abm_campaigns_status | btree | user_id, status | não | sim |  | `CREATE INDEX idx_abm_campaigns_status ON public.abm_campaigns USING btree (user_id, status)` |


## Policies (RLS)

### `abm_campaigns_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_campaigns_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `abm_campaigns_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_campaigns_update`

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
| abm_campaigns_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
