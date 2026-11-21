# public.cs_accounts

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
| 5 | `csm_owner_id` | `uuid` | sim |  |  |  |
| 6 | `account_name` | `text` | não |  |  |  |
| 7 | `tier` | `text` | não | `'mid'::text` |  |  |
| 8 | `arr` | `numeric` | não | `0` |  |  |
| 9 | `contract_start` | `date` | sim |  |  |  |
| 10 | `renewal_date` | `date` | sim |  |  |  |
| 11 | `lifecycle_stage` | `text` | não | `'onboarding'::text` |  |  |
| 12 | `health_score` | `integer` | não | `50` |  |  |
| 13 | `health_trend` | `text` | sim | `'stable'::text` |  |  |
| 14 | `notes` | `text` | sim |  |  |  |
| 15 | `last_health_recalc_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cs_accounts_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| cs_accounts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| cs_accounts_health_score_check | CHECK | `CHECK (health_score >= 0 AND health_score <= 100)` |  |  | sim |
| cs_accounts_health_trend_check | CHECK | `CHECK (health_trend = ANY (ARRAY['up'::text, 'stable'::text, 'down'::text]))` |  |  | sim |
| cs_accounts_lifecycle_stage_check | CHECK | `CHECK (lifecycle_stage = ANY (ARRAY['onboarding'::text, 'adopting'::text, 'mature'::text, 'at_risk'::text, 'churned'::text]))` |  |  | sim |
| cs_accounts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cs_accounts_tier_check | CHECK | `CHECK (tier = ANY (ARRAY['strategic'::text, 'enterprise'::text, 'mid'::text, 'smb'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.cs_health_signals | cs_health_signals_account_id_fkey | account_id | CASCADE |
| public.cs_nps_responses | cs_nps_responses_account_id_fkey | account_id | CASCADE |
| public.cs_qbrs | cs_qbrs_account_id_fkey | account_id | CASCADE |
| public.cs_renewals | cs_renewals_account_id_fkey | account_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cs_accounts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cs_accounts_pkey ON public.cs_accounts USING btree (id)` |
| idx_cs_accounts_health | btree | user_id, health_score | não | sim |  | `CREATE INDEX idx_cs_accounts_health ON public.cs_accounts USING btree (user_id, health_score)` |
| idx_cs_accounts_lifecycle | btree | user_id, lifecycle_stage | não | sim |  | `CREATE INDEX idx_cs_accounts_lifecycle ON public.cs_accounts USING btree (user_id, lifecycle_stage)` |
| idx_cs_accounts_renewal | btree | user_id, renewal_date | não | sim |  | `CREATE INDEX idx_cs_accounts_renewal ON public.cs_accounts USING btree (user_id, renewal_date)` |
| idx_cs_accounts_user | btree | user_id | não | sim |  | `CREATE INDEX idx_cs_accounts_user ON public.cs_accounts USING btree (user_id)` |


## Policies (RLS)

### `cs_accounts_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_accounts_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `cs_accounts_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_accounts_update`

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
| trg_cs_accounts_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
