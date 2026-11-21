# public.cs_health_signals

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
| 4 | `signal_type` | `text` | não |  |  |  |
| 5 | `score` | `numeric` | não | `0` |  |  |
| 6 | `weight` | `numeric` | não | `1` |  |  |
| 7 | `source` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cs_health_signals_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES cs_accounts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cs_health_signals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cs_health_signals_signal_type_check | CHECK | `CHECK (signal_type = ANY (ARRAY['usage'::text, 'support'::text, 'engagement'::text, 'sentiment'::text, 'payment'::text, 'nps'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cs_health_signals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cs_health_signals_pkey ON public.cs_health_signals USING btree (id)` |
| idx_cs_signals_account | btree | account_id, signal_type | não | sim |  | `CREATE INDEX idx_cs_signals_account ON public.cs_health_signals USING btree (account_id, signal_type)` |
| idx_cs_signals_captured | btree | user_id, captured_at | não | sim |  | `CREATE INDEX idx_cs_signals_captured ON public.cs_health_signals USING btree (user_id, captured_at DESC)` |


## Policies (RLS)

### `cs_signals_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_signals_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `cs_signals_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `cs_signals_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
