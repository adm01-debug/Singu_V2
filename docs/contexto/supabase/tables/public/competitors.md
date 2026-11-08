# public.competitors

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `website` | `text` | sim |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `strengths` | `text[]` | sim |  |  |  |
| 6 | `weaknesses` | `text[]` | sim |  |  |  |
| 7 | `price_level` | `text` | sim |  |  |  |
| 8 | `market_share_pct` | `numeric(5,2)` | sim |  |  |  |
| 9 | `is_active` | `boolean` | sim | `true` |  |  |
| 10 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| competitors_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| competitors_price_level_check | CHECK | `CHECK (price_level = ANY (ARRAY['baixo'::text, 'medio'::text, 'alto'::text, 'premium'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.competitive_losses | competitive_losses_competitor_id_fkey | competitor_id | SET NULL |
| public.deal_competitors | deal_competitors_competitor_id_fkey | competitor_id | CASCADE |
| public.win_loss_records | win_loss_records_competitor_id_fkey | competitor_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| competitors_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX competitors_pkey ON public.competitors USING btree (id)` |


## Policies (RLS)

### `competitors_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_competitors_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
