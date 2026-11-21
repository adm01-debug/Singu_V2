# public.win_loss_records

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
| 3 | `deal_id` | `text` | não |  |  |  |
| 4 | `outcome` | `text` | não |  |  |  |
| 5 | `primary_reason_id` | `uuid` | sim |  |  |  |
| 6 | `secondary_reasons` | `text[]` | sim | `ARRAY[]::text[]` |  |  |
| 7 | `competitor_id` | `uuid` | sim |  |  |  |
| 8 | `deal_value` | `numeric(14,2)` | sim |  |  |  |
| 9 | `sales_cycle_days` | `integer` | sim |  |  |  |
| 10 | `decision_maker_contact_id` | `uuid` | sim |  |  |  |
| 11 | `notes` | `text` | sim |  |  |  |
| 12 | `lessons_learned` | `text` | sim |  |  |  |
| 13 | `recorded_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| win_loss_records_competitor_id_fkey | FOREIGN KEY | `FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| win_loss_records_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['won'::text, 'lost'::text, 'no_decision'::text, 'pending'::text]))` |  |  | sim |
| win_loss_records_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| win_loss_records_primary_reason_id_fkey | FOREIGN KEY | `FOREIGN KEY (primary_reason_id) REFERENCES win_loss_reasons(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| win_loss_records_user_id_deal_id_key | UNIQUE | `UNIQUE (user_id, deal_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_win_loss_records_competitor | btree | competitor_id | não | sim |  | `CREATE INDEX idx_win_loss_records_competitor ON public.win_loss_records USING btree (competitor_id)` |
| idx_win_loss_records_primary_reason | btree | primary_reason_id | não | sim |  | `CREATE INDEX idx_win_loss_records_primary_reason ON public.win_loss_records USING btree (primary_reason_id)` |
| idx_win_loss_records_user_outcome | btree | user_id, outcome, recorded_at | não | sim |  | `CREATE INDEX idx_win_loss_records_user_outcome ON public.win_loss_records USING btree (user_id, outcome, recorded_at DESC)` |
| win_loss_records_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX win_loss_records_pkey ON public.win_loss_records USING btree (id)` |
| win_loss_records_user_id_deal_id_key | btree | user_id, deal_id | sim | sim |  | `CREATE UNIQUE INDEX win_loss_records_user_id_deal_id_key ON public.win_loss_records USING btree (user_id, deal_id)` |


## Policies (RLS)

### `users manage own win_loss_records`

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
| trg_win_loss_records_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| trg_win_loss_records_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
