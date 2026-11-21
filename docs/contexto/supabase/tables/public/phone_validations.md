# public.phone_validations

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
| 4 | `phone_input` | `text` | não |  |  |  |
| 5 | `phone_e164` | `text` | sim |  |  |  |
| 6 | `status` | `text` | não | `'unknown'::text` |  |  |
| 7 | `line_type` | `text` | sim |  |  |  |
| 8 | `country` | `text` | sim |  |  |  |
| 9 | `country_code` | `text` | sim |  |  |  |
| 10 | `carrier` | `text` | sim |  |  |  |
| 11 | `is_active` | `boolean` | sim |  |  |  |
| 12 | `reasons` | `text[]` | não | `ARRAY[]::text[]` |  |  |
| 13 | `provider` | `text` | não | `'libphonenumber'::text` |  |  |
| 14 | `raw` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 15 | `validated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| phone_validations_line_type_check | CHECK | `CHECK (line_type = ANY (ARRAY['mobile'::text, 'landline'::text, 'voip'::text, 'toll_free'::text, 'premium'::text, 'unknown'::text]))` |  |  | sim |
| phone_validations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| phone_validations_status_check | CHECK | `CHECK (status = ANY (ARRAY['valid'::text, 'invalid'::text, 'unreachable'::text, 'unknown'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_phone_val_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_phone_val_contact ON public.phone_validations USING btree (contact_id)` |
| idx_phone_val_e164 | btree | phone_e164 | não | sim |  | `CREATE INDEX idx_phone_val_e164 ON public.phone_validations USING btree (phone_e164)` |
| idx_phone_val_user | btree | user_id | não | sim |  | `CREATE INDEX idx_phone_val_user ON public.phone_validations USING btree (user_id)` |
| idx_phone_val_validated_at | btree | validated_at | não | sim |  | `CREATE INDEX idx_phone_val_validated_at ON public.phone_validations USING btree (validated_at DESC)` |
| phone_validations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX phone_validations_pkey ON public.phone_validations USING btree (id)` |


## Policies (RLS)

### `pv_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `pv_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `pv_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `pv_update_own`

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
| trg_pv_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
