# public.cs_renewals

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
| 3 | `account_id` | `uuid` | não |  |  |  |
| 4 | `renewal_date` | `date` | não |  |  |  |
| 5 | `status` | `text` | não | `'upcoming'::text` |  |  |
| 6 | `forecasted_arr` | `numeric` | não | `0` |  |  |
| 7 | `actual_arr` | `numeric` | sim |  |  |  |
| 8 | `risk_level` | `text` | não | `'low'::text` |  |  |
| 9 | `notes` | `text` | sim |  |  |  |
| 10 | `closed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cs_renewals_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES cs_accounts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cs_renewals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cs_renewals_risk_level_check | CHECK | `CHECK (risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| cs_renewals_status_check | CHECK | `CHECK (status = ANY (ARRAY['upcoming'::text, 'in_negotiation'::text, 'renewed'::text, 'churned'::text, 'downgraded'::text, 'expanded'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cs_renewals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cs_renewals_pkey ON public.cs_renewals USING btree (id)` |


## Policies (RLS)

### `cs_renewals_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_renewals_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `cs_renewals_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_renewals_update`

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
| trg_cs_renewals_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
