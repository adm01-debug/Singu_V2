# public.marketing_campaign_stats

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `campaign_id` | `uuid` | sim |  |  |  |
| 4 | `entity_type` | `text` | não |  |  |  |
| 5 | `entity_id` | `uuid` | não |  |  |  |
| 6 | `date` | `date` | não | `CURRENT_DATE` |  |  |
| 7 | `views` | `integer` | sim | `0` |  |  |
| 8 | `clicks` | `integer` | sim | `0` |  |  |
| 9 | `submissions` | `integer` | sim | `0` |  |  |
| 10 | `conversions` | `integer` | sim | `0` |  |  |
| 11 | `spend` | `numeric(12,2)` | sim | `0` |  |  |
| 12 | `revenue` | `numeric(12,2)` | sim | `0` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| marketing_campaign_stats_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| marketing_campaign_stats_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX marketing_campaign_stats_pkey ON public.marketing_campaign_stats USING btree (id)` |


## Policies (RLS)

### `Users can insert their own marketing stats`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own marketing stats`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own marketing stats`

| campo | valor |
|---|---|
| comando | SELECT |
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
