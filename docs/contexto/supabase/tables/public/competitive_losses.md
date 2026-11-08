# public.competitive_losses

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
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `competitor_id` | `uuid` | sim |  |  |  |
| 5 | `competitor_name` | `text` | sim |  |  |  |
| 6 | `loss_reason` | `text` | sim |  |  |  |
| 7 | `price_difference` | `numeric` | sim |  |  |  |
| 8 | `notes` | `text` | sim |  |  |  |
| 9 | `reported_by` | `uuid` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| competitive_losses_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| competitive_losses_competitor_id_fkey | FOREIGN KEY | `FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| competitive_losses_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| competitive_losses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| competitive_losses_reported_by_fkey | FOREIGN KEY | `FOREIGN KEY (reported_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| competitive_losses_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX competitive_losses_pkey ON public.competitive_losses USING btree (id)` |
| idx_competitive_losses_company_id_fk | btree | company_id | não | sim |  | `CREATE INDEX idx_competitive_losses_company_id_fk ON public.competitive_losses USING btree (company_id)` |
| idx_competitive_losses_competitor_id | btree | competitor_id | não | sim |  | `CREATE INDEX idx_competitive_losses_competitor_id ON public.competitive_losses USING btree (competitor_id)` |
| idx_competitive_losses_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_competitive_losses_deal_id ON public.competitive_losses USING btree (deal_id)` |
| idx_competitive_losses_reported_by | btree | reported_by | não | sim |  | `CREATE INDEX idx_competitive_losses_reported_by ON public.competitive_losses USING btree (reported_by)` |


## Policies (RLS)

### `Authenticated read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
