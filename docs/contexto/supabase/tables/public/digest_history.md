# public.digest_history

> Histórico de digests enviados

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_notification_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `digest_type` | `character varying(20)` | não |  |  |  |
| 4 | `period_start` | `timestamp with time zone` | não |  |  |  |
| 5 | `period_end` | `timestamp with time zone` | não |  |  |  |
| 6 | `summary_data` | `jsonb` | não |  |  |  |
| 7 | `total_interactions` | `integer` | sim |  |  |  |
| 8 | `new_contacts` | `integer` | sim |  |  |  |
| 9 | `deals_won` | `integer` | sim |  |  |  |
| 10 | `deals_lost` | `integer` | sim |  |  |  |
| 11 | `revenue_won` | `numeric(15,2)` | sim |  |  |  |
| 12 | `follow_ups_completed` | `integer` | sim |  |  |  |
| 13 | `follow_ups_pending` | `integer` | sim |  |  |  |
| 14 | `highlights` | `text[]` | sim |  |  |  |
| 15 | `alerts` | `text[]` | sim |  |  |  |
| 16 | `recommendations` | `text[]` | sim |  |  |  |
| 17 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `sent_to_email` | `character varying(255)` | sim |  |  |  |
| 19 | `delivery_status` | `character varying(20)` | sim |  |  |  |
| 20 | `opened_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| digest_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| digest_history_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| digest_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX digest_history_pkey ON public.digest_history USING btree (id)` |


## Policies (RLS)

### `digest_history_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `service_role_full_digest_history`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
