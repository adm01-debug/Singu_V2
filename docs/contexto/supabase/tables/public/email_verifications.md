# public.email_verifications

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
| 4 | `email` | `text` | não |  |  |  |
| 5 | `status` | `text` | não | `'unknown'::text` |  |  |
| 6 | `score` | `integer` | não | `0` |  |  |
| 7 | `mx_found` | `boolean` | não | `false` |  |  |
| 8 | `smtp_check` | `boolean` | não | `false` |  |  |
| 9 | `disposable` | `boolean` | não | `false` |  |  |
| 10 | `role_account` | `boolean` | não | `false` |  |  |
| 11 | `free_provider` | `boolean` | não | `false` |  |  |
| 12 | `reasons` | `text[]` | não | `ARRAY[]::text[]` |  |  |
| 13 | `provider` | `text` | não | `'internal'::text` |  |  |
| 14 | `raw` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 15 | `verified_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| email_verifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| email_verifications_score_check | CHECK | `CHECK (score >= 0 AND score <= 100)` |  |  | sim |
| email_verifications_status_check | CHECK | `CHECK (status = ANY (ARRAY['valid'::text, 'invalid'::text, 'risky'::text, 'unknown'::text, 'catchall'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| email_verifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX email_verifications_pkey ON public.email_verifications USING btree (id)` |
| idx_email_verif_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_email_verif_contact ON public.email_verifications USING btree (contact_id)` |
| idx_email_verif_email | btree |  | não | sim |  | `CREATE INDEX idx_email_verif_email ON public.email_verifications USING btree (lower(email))` |
| idx_email_verif_user | btree | user_id | não | sim |  | `CREATE INDEX idx_email_verif_user ON public.email_verifications USING btree (user_id)` |
| idx_email_verif_verified_at | btree | verified_at | não | sim |  | `CREATE INDEX idx_email_verif_verified_at ON public.email_verifications USING btree (verified_at DESC)` |


## Policies (RLS)

### `ev_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `ev_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `ev_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `ev_update_own`

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
| trg_ev_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
