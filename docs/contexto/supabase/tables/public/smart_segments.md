# public.smart_segments

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
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `filters` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 5 | `entity_type` | `text` | sim | `'company'::text` |  |  |
| 6 | `is_dynamic` | `boolean` | sim | `true` |  |  |
| 7 | `cached_count` | `integer` | sim | `0` |  |  |
| 8 | `last_calculated_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `created_by` | `uuid` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| smart_segments_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| smart_segments_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['company'::text, 'contact'::text, 'deal'::text]))` |  |  | sim |
| smart_segments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_smart_segments_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_smart_segments_created_by ON public.smart_segments USING btree (created_by)` |
| smart_segments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX smart_segments_pkey ON public.smart_segments USING btree (id)` |


## Policies (RLS)

### `smart_segments_all`

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
| trg_smart_segments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
