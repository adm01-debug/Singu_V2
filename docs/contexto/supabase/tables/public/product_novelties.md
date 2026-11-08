# public.product_novelties

> Ciclo de vida do selo NOVO. Pipeline popula via fn_populate_novelties_from_supplier. Trigger sincroniza products.is_new automaticamente.

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `product_id` | `uuid` | não |  |  |  |
| 3 | `supplier_id` | `uuid` | sim |  |  |  |
| 4 | `supplier_code` | `character varying(100)` | sim |  |  |  |
| 5 | `supplier_product_code` | `character varying(100)` | sim |  |  |  |
| 6 | `source` | `text` | não | `'manual'::text` |  |  |
| 7 | `detected_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `is_active` | `boolean` | não | `true` |  |  |
| 10 | `is_highlighted` | `boolean` | não | `false` |  |  |
| 11 | `notes` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_pn_source | CHECK | `CHECK (source = ANY (ARRAY['manual'::text, 'import'::text, 'pipeline_auto'::text, 'pipeline_backfill'::text, 'migration_from_supplier'::text, 'spot_new_product'::text, 'spot_catalogo_novidades'::text, 'xbz_recently_promoted'::text, 'asia_recently_promoted'::text, 'sm_recently_promoted'::text, '88brindes_recently_promoted'::text]))` |  |  | sim |
| product_novelties_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| product_novelties_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| product_novelties_product_id_unique | UNIQUE | `UNIQUE (product_id)` |  |  | sim |
| product_novelties_supplier_id_fkey | FOREIGN KEY | `FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_product_novelties_supplier_id | btree | supplier_id | não | sim |  | `CREATE INDEX idx_product_novelties_supplier_id ON public.product_novelties USING btree (supplier_id)` |
| product_novelties_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX product_novelties_pkey ON public.product_novelties USING btree (id)` |
| product_novelties_product_id_unique | btree | product_id | sim | sim |  | `CREATE UNIQUE INDEX product_novelties_product_id_unique ON public.product_novelties USING btree (product_id)` |


## Policies (RLS)

### `authenticated_read_novelties`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `service_all_novelties`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_novelty_updated_at | BEFORE | UPDATE | ROW | enabled | public.fn_set_novelty_updated_at |
| trg_sync_novelty_to_product | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.fn_sync_novelty_to_product |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
