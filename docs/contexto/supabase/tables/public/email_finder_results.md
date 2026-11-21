# public.email_finder_results

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
| 4 | `full_name` | `text` | não |  |  |  |
| 5 | `first_name` | `text` | sim |  |  |  |
| 6 | `last_name` | `text` | sim |  |  |  |
| 7 | `domain` | `text` | não |  |  |  |
| 8 | `candidates` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `best_email` | `text` | sim |  |  |  |
| 10 | `best_confidence` | `integer` | não | `0` |  |  |
| 11 | `sources` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 12 | `found_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| email_finder_results_best_confidence_check | CHECK | `CHECK (best_confidence >= 0 AND best_confidence <= 100)` |  |  | sim |
| email_finder_results_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| email_finder_results_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX email_finder_results_pkey ON public.email_finder_results USING btree (id)` |
| idx_efr_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_efr_contact ON public.email_finder_results USING btree (contact_id)` |
| idx_efr_domain | btree | domain | não | sim |  | `CREATE INDEX idx_efr_domain ON public.email_finder_results USING btree (domain)` |
| idx_efr_user | btree | user_id | não | sim |  | `CREATE INDEX idx_efr_user ON public.email_finder_results USING btree (user_id)` |


## Policies (RLS)

### `efr_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `efr_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `efr_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `efr_update_own`

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
| trg_efr_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
