# public.commissions

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
| 3 | `deal_id` | `uuid` | sim |  |  |  |
| 4 | `rule_id` | `uuid` | sim |  |  |  |
| 5 | `deal_value` | `numeric(15,2)` | não |  |  |  |
| 6 | `commission_pct` | `numeric(5,2)` | não |  |  |  |
| 7 | `commission_value` | `numeric(15,2)` | não |  |  |  |
| 8 | `status` | `text` | sim | `'pending'::text` |  |  |
| 9 | `approved_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `paid_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| commissions_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| commissions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| commissions_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (rule_id) REFERENCES commission_rules(id)` | NO ACTION | NO ACTION | sim |
| commissions_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text]))` |  |  | sim |
| commissions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| commissions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX commissions_pkey ON public.commissions USING btree (id)` |
| idx_commissions_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_commissions_deal_id ON public.commissions USING btree (deal_id)` |
| idx_commissions_rule_id | btree | rule_id | não | sim |  | `CREATE INDEX idx_commissions_rule_id ON public.commissions USING btree (rule_id)` |
| idx_commissions_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_commissions_user_id ON public.commissions USING btree (user_id)` |


## Policies (RLS)

### `commissions_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `commissions_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `commissions_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `commissions_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

_nenhum_
