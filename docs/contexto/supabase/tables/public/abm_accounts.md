# public.abm_accounts

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
| 3 | `external_company_id` | `text` | não |  |  |  |
| 4 | `company_name` | `text` | não |  |  |  |
| 5 | `parent_account_id` | `uuid` | sim |  |  |  |
| 6 | `tier` | `text` | não | `'mid'::text` |  |  |
| 7 | `account_score` | `integer` | não | `0` |  |  |
| 8 | `score_breakdown` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `status` | `text` | não | `'active'::text` |  |  |
| 10 | `assigned_to` | `uuid` | sim |  |  |  |
| 11 | `target_revenue` | `numeric` | sim |  |  |  |
| 12 | `notes` | `text` | sim |  |  |  |
| 13 | `last_scored_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| abm_accounts_account_score_check | CHECK | `CHECK (account_score >= 0 AND account_score <= 100)` |  |  | sim |
| abm_accounts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| abm_accounts_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'nurture'::text, 'closed_won'::text, 'closed_lost'::text, 'paused'::text]))` |  |  | sim |
| abm_accounts_tier_check | CHECK | `CHECK (tier = ANY (ARRAY['strategic'::text, 'enterprise'::text, 'mid'::text, 'smb'::text]))` |  |  | sim |
| abm_accounts_user_id_external_company_id_key | UNIQUE | `UNIQUE (user_id, external_company_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| abm_accounts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX abm_accounts_pkey ON public.abm_accounts USING btree (id)` |
| abm_accounts_user_id_external_company_id_key | btree | user_id, external_company_id | sim | sim |  | `CREATE UNIQUE INDEX abm_accounts_user_id_external_company_id_key ON public.abm_accounts USING btree (user_id, external_company_id)` |
| idx_abm_accounts_external | btree | external_company_id | não | sim |  | `CREATE INDEX idx_abm_accounts_external ON public.abm_accounts USING btree (external_company_id)` |
| idx_abm_accounts_parent | btree | parent_account_id | não | sim |  | `CREATE INDEX idx_abm_accounts_parent ON public.abm_accounts USING btree (parent_account_id)` |
| idx_abm_accounts_tier | btree | user_id, tier | não | sim |  | `CREATE INDEX idx_abm_accounts_tier ON public.abm_accounts USING btree (user_id, tier)` |
| idx_abm_accounts_user | btree | user_id | não | sim |  | `CREATE INDEX idx_abm_accounts_user ON public.abm_accounts USING btree (user_id)` |


## Policies (RLS)

### `abm_accounts_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_accounts_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `abm_accounts_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_accounts_update`

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
| abm_accounts_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| abm_accounts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
