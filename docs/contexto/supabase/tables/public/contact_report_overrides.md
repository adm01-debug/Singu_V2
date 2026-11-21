# public.contact_report_overrides

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `insights_data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 4 | `custom_scripts` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `timezone('utc'::text, now())` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `timezone('utc'::text, now())` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_report_overrides_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_report_overrides_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_report_overrides_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_report_overrides_contact_id_key ON public.contact_report_overrides USING btree (contact_id)` |
| contact_report_overrides_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_report_overrides_pkey ON public.contact_report_overrides USING btree (id)` |


## Policies (RLS)

### `Users can insert report overrides`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `Users can update report overrides`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `Users can view report overrides`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_contact_report_overrides_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
