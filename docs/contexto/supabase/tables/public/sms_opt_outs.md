# public.sms_opt_outs

> SINGU: Lista de telefones que fizeram opt-out de SMS (compliance LGPD). Check obrigatório antes de envio.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `phone_number` | `text` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `reason` | `text` | sim |  |  |  |
| 6 | `source` | `text` | sim |  |  |  |
| 7 | `opted_out_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `phone` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sms_opt_outs_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| sms_opt_outs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sms_opt_outs_source_check | CHECK | `CHECK (source = ANY (ARRAY['sms_reply'::text, 'request'::text, 'bounce'::text, 'complaint'::text, 'manual'::text, 'gdpr'::text]))` |  |  | sim |
| unique_opt_out | UNIQUE | `UNIQUE (user_id, phone_number)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sms_opt_outs_user_phone | btree | user_id, phone | não | sim |  | `CREATE INDEX idx_sms_opt_outs_user_phone ON public.sms_opt_outs USING btree (user_id, phone)` |
| sms_opt_outs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sms_opt_outs_pkey ON public.sms_opt_outs USING btree (id)` |
| unique_opt_out | btree | user_id, phone_number | sim | sim |  | `CREATE UNIQUE INDEX unique_opt_out ON public.sms_opt_outs USING btree (user_id, phone_number)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users manage own SMS opt-outs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
