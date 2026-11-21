# public.attribution_touchpoints

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
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `deal_id` | `text` | sim |  |  |  |
| 5 | `touchpoint_type` | `text` | não |  |  |  |
| 6 | `source` | `text` | sim |  |  |  |
| 7 | `medium` | `text` | sim |  |  |  |
| 8 | `campaign` | `text` | sim |  |  |  |
| 9 | `content` | `text` | sim |  |  |  |
| 10 | `term` | `text` | sim |  |  |  |
| 11 | `page_url` | `text` | sim |  |  |  |
| 12 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 13 | `occurred_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `value_attributed` | `numeric` | não | `0` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| attribution_touchpoints_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| attribution_touchpoints_touchpoint_type_check | CHECK | `CHECK (touchpoint_type = ANY (ARRAY['form'::text, 'email'::text, 'page_view'::text, 'magnet'::text, 'sequence'::text, 'call'::text, 'meeting'::text, 'ad'::text, 'social'::text, 'referral'::text, 'other'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| attribution_touchpoints_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX attribution_touchpoints_pkey ON public.attribution_touchpoints USING btree (id)` |


## Policies (RLS)

### `atp_owner_all`

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
