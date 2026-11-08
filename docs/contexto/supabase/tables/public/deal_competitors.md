# public.deal_competitors

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
| 2 | `deal_id` | `uuid` | sim |  |  |  |
| 3 | `competitor_id` | `uuid` | sim |  |  |  |
| 4 | `status` | `text` | sim | `'competing'::text` |  |  |
| 5 | `notes` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_competitors_competitor_id_fkey | FOREIGN KEY | `FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| deal_competitors_deal_id_competitor_id_key | UNIQUE | `UNIQUE (deal_id, competitor_id)` |  |  | sim |
| deal_competitors_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| deal_competitors_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_competitors_status_check | CHECK | `CHECK (status = ANY (ARRAY['competing'::text, 'won_against'::text, 'lost_to'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_competitors_deal_id_competitor_id_key | btree | deal_id, competitor_id | sim | sim |  | `CREATE UNIQUE INDEX deal_competitors_deal_id_competitor_id_key ON public.deal_competitors USING btree (deal_id, competitor_id)` |
| deal_competitors_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_competitors_pkey ON public.deal_competitors USING btree (id)` |
| idx_deal_competitors_competitor_id | btree | competitor_id | não | sim |  | `CREATE INDEX idx_deal_competitors_competitor_id ON public.deal_competitors USING btree (competitor_id)` |
| idx_deal_competitors_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_deal_competitors_deal_id ON public.deal_competitors USING btree (deal_id)` |


## Policies (RLS)

### `deal_competitors_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

_nenhum_
